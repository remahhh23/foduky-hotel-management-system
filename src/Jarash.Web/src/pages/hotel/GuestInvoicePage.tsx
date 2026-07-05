import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { invoiceService } from "./invoiceService";
import { roomService } from "./roomService";
import { servicesService } from "./servicesService";
import { reservationService } from "./reservationService";
import { cashTransactionService } from "@/pages/cash/cashService";
import { getHotelCashFundId } from "@/pages/settings/HotelSettings";
import { SERVICE_TYPE_LABELS } from "./hotelTypes";
import type { Reservation, ServiceRequest, SeasonPrice } from "./hotelTypes";

interface InvoiceData {
  reservation: Reservation | null;
  roomPrice: number;
  nights: number;
  roomTotal: number;
  services: ServiceRequest[];
  serviceTotal: number;
  subtotal: number;
  paymentsTotal: number;
}

function calcPaymentsTotal(reservationId: string): number {
  const all = invoiceService.getAllLocal().filter((i) => i.invoiceType === "payment" && i.reservationId === reservationId && i.status === "paid");
  return all.reduce((s, i) => s + i.amount, 0);
}

function calcInvoice(
  reservation: Reservation,
  rooms: { id: string; roomNumber: string; floor: number; typeId: string }[],
  allPrices: SeasonPrice[],
  allServices: ServiceRequest[],
): InvoiceData {
  const room = rooms.find((r) => r.id === reservation.roomId);
  const typePrices = allPrices.filter((p) => room && p.roomTypeId === room.typeId);
  const roomPrice = typePrices.length > 0 ? typePrices[typePrices.length - 1].price : 0;
  const checkIn = new Date(reservation.checkIn);
  const checkOut = new Date(reservation.checkOut);
  const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000));
  const roomTotal = roomPrice * nights;
  const stayStart = checkIn.getTime();
  const stayEnd = checkOut.getTime();
  const services = allServices.filter((s) => {
    if (s.roomNumber !== room?.roomNumber || s.status !== "completed") return false;
    const createdAt = s.createdAt ? new Date(s.createdAt).getTime() : 0;
    return createdAt >= stayStart && createdAt <= stayEnd;
  });
  const serviceTotal = services.reduce((sum, s) => sum + s.amount, 0);
  const paymentsTotal = calcPaymentsTotal(reservation.id);
  return { reservation, roomPrice, nights, roomTotal, services, serviceTotal, subtotal: roomTotal + serviceTotal, paymentsTotal };
}

export default function GuestInvoicePage({ onBack, selectedReservationId }: { onBack: () => void; selectedReservationId?: string }) {
  const [occupiedRooms, setOccupiedRooms] = useState<{ id: string; roomNumber: string; guestName: string; reservationId: string }[]>([]);
  const [selectedResId, setSelectedResId] = useState(selectedReservationId || "");
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [editPrice, setEditPrice] = useState<number | null>(null);
  const [confirmedPrice, setConfirmedPrice] = useState<number | null>(null);
  const [discountType, setDiscountType] = useState<"none" | "percentage" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState(0);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [reservations, rooms] = await Promise.all([reservationService.getActive(), roomService.getRooms()]);
      const occupied = reservations
        .map((r) => {
          const room = rooms.find((rm) => rm.id === r.roomId);
          return room ? { id: r.id, roomNumber: room.roomNumber, guestName: r.guestName, reservationId: r.id } : null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);
      setOccupiedRooms(occupied);
    } catch {
      setOccupiedRooms([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selectedResId) { setInvoice(null); return; }
    setDiscountType("none");
    setDiscountValue(0);
    setEditPrice(null);
    Promise.all([
      reservationService.getById(selectedResId),
      roomService.getRooms(),
      roomService.getPrices(),
      servicesService.getAll(),
    ]).then(([reservation, rooms, prices, services]) => {
      if (!reservation) { setInvoice(null); return; }
      setInvoice(calcInvoice(reservation, rooms, prices, services));
    });
  }, [selectedResId]);

  function getEffectivePrice(): number {
    if (confirmedPrice !== null) return confirmedPrice;
    return editPrice !== null ? editPrice : (invoice?.roomPrice ?? 0);
  }

  function getEffectiveRoomTotal(): number {
    if (!invoice) return 0;
    return getEffectivePrice() * invoice.nights;
  }

  function getEffectiveSubtotal(): number {
    if (!invoice) return 0;
    return getEffectiveRoomTotal() + invoice.serviceTotal;
  }

  function getDiscount(): number {
    const subtotal = getEffectiveSubtotal();
    if (!invoice || discountType === "none") return 0;
    if (discountType === "percentage") return subtotal * (Math.min(discountValue, 100) / 100);
    return Math.min(discountValue, subtotal);
  }

  function getPaid(): number {
    return invoice?.paymentsTotal ?? 0;
  }

  function getTotal(): number {
    if (!invoice) return 0;
    return Math.max(0, getEffectiveSubtotal() - getDiscount() - getPaid());
  }

  async function handleSave() {
    if (!invoice?.reservation) return;
    setSaving(true);
    try {
      const finalTotal = getTotal();
      const room = occupiedRooms.find((r) => r.reservationId === invoice.reservation!.id);
      const date = new Date().toISOString().split("T")[0];
      const paid = getPaid();
      const desc = `إقامة ${invoice.nights} ليلة (${invoice.reservation.checkIn} إلى ${invoice.reservation.checkOut})${discountType !== "none" ? ` + خصم ${discountValue}${discountType === "percentage" ? "%" : "‏د.م"}` : ""}${paid > 0 ? ` - المدفوع: ${paid}` : ""}`;

      await invoiceService.create({
        guestName: invoice.reservation.guestName,
        roomNumber: room?.roomNumber ?? "",
        reservationId: invoice.reservation.id,
        description: desc,
        amount: finalTotal,
        invoiceType: "stay",
        status: "paid",
        date,
        notes: "",
      });

      await reservationService.update(invoice.reservation.id, { status: "completed" });
      await roomService.updateRoom(invoice.reservation.roomId, { status: "available" });

      if (finalTotal > 0) {
        const fundId = getHotelCashFundId();
        const fund = fundId ? { id: fundId, name: "" } : null;
        cashTransactionService.create({
          fundId: fundId || "external",
          fundName: fund?.name ?? "صندوق افتراضي",
          type: "receipt",
          amount: finalTotal,
          description: `مغادرة - ${invoice.reservation.guestName} - غرفة ${room?.roomNumber}`,
          reference: `INV-${invoice.reservation.id.slice(-8)}`,
          counterparty: invoice.reservation.guestName,
          notes: "",
          date,
        });
      }

      logger.info("GuestInvoicePage: checkout completed", { reservationId: invoice.reservation.id, total: finalTotal });
      onBack();
    } catch (err) {
      logger.error("GuestInvoicePage: failed", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">حساب إقامة النزيل</h3>
      </div>

      <div className="mb-4 max-w-xs">
        <label className="mb-1 block text-xs font-medium text-slate-400">اختر الغرفة المشغولة</label>
        <select value={selectedResId} onChange={(e) => setSelectedResId(e.target.value)}
          className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500">
          <option value="">اختر الغرفة</option>
          {occupiedRooms.map((r) => (
            <option key={r.reservationId} value={r.reservationId}>غرفة {r.roomNumber} — {r.guestName}</option>
          ))}
        </select>
        {occupiedRooms.length === 0 && <p className="mt-1 text-xs text-amber-500">لا توجد غرف مشغولة</p>}
      </div>

      {!selectedResId && (
        <div className="rounded-xl border border-white/10 p-8 text-center">
          <p className="text-sm text-slate-400">اختر غرفة مشغولة لعرض فاتورة الإقامة</p>
        </div>
      )}

      {invoice && invoice.reservation && (
        <div className="max-w-2xl space-y-4">
          <div className="rounded-xl border border-white/10 bg-card-bg p-5">
            <h4 className="mb-4 text-base font-bold text-white">تفاصيل الإقامة</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-[10px] text-slate-400">النزيل</p>
                <p className="text-sm font-medium text-white">{invoice.reservation.guestName}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-[10px] text-slate-400">تاريخ الدخول</p>
                <p className="text-sm font-medium text-white">{invoice.reservation.checkIn}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-[10px] text-slate-400">تاريخ المغادرة</p>
                <p className="text-sm font-medium text-white">{invoice.reservation.checkOut}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-[10px] text-slate-400">مدة الإقامة</p>
                <p className="text-sm font-medium text-white">{invoice.nights} ليلة</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-card-bg p-5">
            <h4 className="mb-3 text-base font-bold text-white">تفاصيل الفاتورة</h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-sm text-slate-400">
                  إيجار الغرفة ({invoice.nights} ليلة × {getEffectivePrice()} ‏د.م)
                </span>
                <div className="flex items-center gap-2">
                  {editPrice !== null ? (
                    <input type="number" min={0} value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                      className="w-20 rounded border border-white/20 px-2 py-0.5 text-left text-sm outline-none focus:border-sky-500" dir="ltr" />
                  ) : (
                    <span className="text-sm text-white" dir="ltr">{getEffectiveRoomTotal().toLocaleString("en-US", { minimumFractionDigits: 2 })} ‏د.م</span>
                  )}
                  <button onClick={() => {
                    if (confirmedPrice !== null) {
                      setConfirmedPrice(null);
                      setEditPrice(invoice.roomPrice);
                    } else if (editPrice !== null) {
                      setConfirmedPrice(editPrice);
                      setEditPrice(null);
                    } else {
                      setEditPrice(invoice.roomPrice);
                    }
                  }}
                    className="text-[10px] text-sky-400 hover:text-sky-300 transition-colors">
                    {confirmedPrice !== null ? "تراجع" : editPrice !== null ? "تأكيد" : "تعديل"}
                  </button>
                </div>
              </div>

              {invoice.services.length === 0 && (
                <div className="border-b border-white/5 pb-2 text-sm text-slate-500">لا توجد خدمات مضافة</div>
              )}

              {invoice.services.map((s, idx) => (
                <div key={s.id || idx} className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div>
                    <span className="text-sm text-slate-400">{s.item || SERVICE_TYPE_LABELS[s.serviceType]}</span>
                    <span className="mr-2 text-[10px] text-slate-500">({SERVICE_TYPE_LABELS[s.serviceType]})</span>
                  </div>
                  <span className="text-sm text-white" dir="ltr">
                    {s.quantity > 1 ? `${s.quantity} × ` : ""}
                    {s.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} ‏د.م
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">إجمالي الخدمات</span>
                <span className="text-sm text-white" dir="ltr">{invoice.serviceTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} ‏د.م</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">الإجمالي قبل الخصم</span>
                <span className="text-base font-semibold text-white" dir="ltr">{getEffectiveSubtotal().toLocaleString("en-US", { minimumFractionDigits: 2 })} ‏د.م</span>
              </div>
              {getPaid() > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-400">المدفوع مسبقاً</span>
                  <span className="text-sm font-medium text-emerald-400" dir="ltr">- {getPaid().toLocaleString("en-US", { minimumFractionDigits: 2 })} ‏د.م</span>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <h5 className="mb-2 text-sm font-bold text-amber-400">الخصم</h5>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1 block text-[10px] text-slate-400">نوع الخصم</label>
                  <select value={discountType} onChange={(e) => { setDiscountType(e.target.value as typeof discountType); setDiscountValue(0); }}
                    className="rounded-lg border border-white/20 bg-white/5 px-2 py-1.5 text-sm outline-none focus:border-sky-500">
                    <option value="none">بدون خصم</option>
                    <option value="percentage">نسبة مئوية</option>
                    <option value="fixed">مبلغ ثابت</option>
                  </select>
                </div>
                {discountType !== "none" && (
                  <div>
                    <label className="mb-1 block text-[10px] text-slate-400">
                      {discountType === "percentage" ? "نسبة الخصم (%)" : "قيمة الخصم (‏د.م)"}
                    </label>
                    <input type="number" min={0} max={discountType === "percentage" ? 100 : getEffectiveSubtotal()} value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-24 rounded-lg border border-white/20 bg-white/5 px-2 py-1.5 text-sm outline-none focus:border-sky-500" dir="ltr" />
                  </div>
                )}
                {discountType !== "none" && getDiscount() > 0 && (
                  <div className="text-sm text-amber-400" dir="ltr">
                    الخصم: {getDiscount().toLocaleString("en-US", { minimumFractionDigits: 2 })} ‏د.م
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-lg font-bold text-white">الإجمالي النهائي</span>
              <span className="text-xl font-bold text-green-400" dir="ltr">{getTotal().toLocaleString("en-US", { minimumFractionDigits: 2 })} ‏د.م</span>
            </div>

            <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
              <p className="text-sm text-emerald-400">
                سيتم إنهاء الحجز وتحرير الغرفة عند تسجيل الفاتورة
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={handleSave} disabled={saving || getTotal() < 0}>
                {saving ? "جاري الحفظ..." : "تسجيل الفاتورة وإنهاء الإقامة"}
              </Button>
              <Button type="button" variant="outline" onClick={onBack}>إلغاء</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

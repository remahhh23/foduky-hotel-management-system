import { useState, useEffect, useCallback } from "react";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { roomService } from "./roomService";
import { reservationService } from "./reservationService";
import { invoiceService } from "./invoiceService";
import { getHotelCashFundId } from "@/pages/settings/HotelSettings";
import { recordExternalPayment } from "@/lib/integration";
import type { Reservation } from "./hotelTypes";
import { RESERVATION_STATUS_LABELS, RESERVATION_STATUS_COLORS } from "./hotelTypes";
import { cn } from "@/lib/utils";

export default function CancelReservation({ onBack, selectedReservationId }: { onBack: () => void; selectedReservationId?: string }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<{ id: string; roomNumber: string }[]>([]);

  const load = useCallback(async () => {
    const [r, rm] = await Promise.all([reservationService.getActive(), roomService.getRooms()]);
    setReservations(r);
    setRooms(rm);
  }, []);

  useEffect(() => { load(); }, [load]);

  const [processing, setProcessing] = useState<string | null>(null);

  async function handleCancel(id: string, roomId: string) {
    if (!confirm("تأكيد إلغاء هذا الحجز؟\nسيتم رد أي دفعات مسبقة.")) return;
    setProcessing(id);
    try {
      const allInvoices = invoiceService.getAllLocal();
      const payments = allInvoices.filter((i) => i.invoiceType === "payment" && i.reservationId === id && i.status === "paid");
      const totalPaid = payments.reduce((s, i) => s + i.amount, 0);

      if (totalPaid > 0) {
        const fundId = getHotelCashFundId();
        if (!confirm(`للنزيل مدفوعات مسبقة بقيمة ${totalPaid} ‏د.م. هل تريد رد المبلغ للنزيل؟`)) return;
        const today = new Date().toISOString().split("T")[0];
        recordExternalPayment(`رد دفعة حجز ملغي - ${payments[0]?.guestName || ""}`, totalPaid, payments[0]?.guestName || "", `CNCL-${id.slice(-8)}`, today);
        for (const p of payments) {
          await invoiceService.update(p.id, { status: "refunded" });
        }
      }

      await reservationService.cancel(id);
      await roomService.updateRoom(roomId, { status: "available" });
      await load();
    } catch (err) {
      logger.error("CancelReservation: failed", err);
    } finally {
      setProcessing(null);
    }
  }

  useEffect(() => {
    if (selectedReservationId && reservations.length > 0) {
      const found = reservations.find((r) => r.id === selectedReservationId);
      if (found) handleCancel(found.id, found.roomId);
    }
  }, [selectedReservationId, reservations]);

  function getRoomNumber(roomId: string): string {
    return rooms.find((r) => r.id === roomId)?.roomNumber ?? "—";
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">إلغاء الحجز <span className="text-sm font-normal text-slate-400">({reservations.length})</span></h3>
      </div>

      <p className="mb-4 text-sm text-slate-500">الحجوزات النشطة حالياً — اختر الحجز الذي تريد إلغاءه</p>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-slate-400">النزيل</th>
              <th className="px-4 py-3 text-right font-medium text-slate-400">الغرفة</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">الدخول</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">المغادرة</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">الحالة</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reservations.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">لا توجد حجوزات نشطة</td></tr>
            )}
            {reservations.map((r) => (
              <tr key={r.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{r.guestName}</td>
                <td className="px-4 py-3 text-slate-500">{getRoomNumber(r.roomId)}</td>
                <td className="px-4 py-3 text-center text-slate-500">{r.checkIn}</td>
                <td className="px-4 py-3 text-center text-slate-500">{r.checkOut}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", RESERVATION_STATUS_COLORS[r.status])}>{RESERVATION_STATUS_LABELS[r.status]}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleCancel(r.id, r.roomId)}
                    disabled={processing === r.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <Ban className={`h-4 w-4 ${processing === r.id ? "animate-spin" : ""}`} />
                    {processing === r.id ? "جاري..." : "إلغاء"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

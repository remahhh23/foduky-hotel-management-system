import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { roomService } from "./roomService";
import { reservationService } from "./reservationService";
import type { SeasonPrice } from "./hotelTypes";

const initialForm = {
  guestName: "",
  guestPhone: "",
  roomId: "",
  checkIn: new Date().toISOString().split("T")[0],
  checkOut: new Date(Date.now() + 86400000).toISOString().split("T")[0],
  notes: "",
  totalAmount: 0,
};

interface RoomOption {
  id: string;
  roomNumber: string;
  floor: number;
  typeId: string;
}

function getRoomPrice(room: RoomOption | undefined, prices: SeasonPrice[]): number {
  if (!room) return 0;
  const typePrices = prices.filter((p) => p.roomTypeId === room.typeId);
  if (typePrices.length === 0) return 0;
  return typePrices[typePrices.length - 1]?.price ?? 0;
}

export default function NewReservation({ onBack, selectedRoomId }: { onBack: () => void; selectedRoomId?: string }) {
  const [form, setForm] = useState(selectedRoomId ? { ...initialForm, roomId: selectedRoomId } : initialForm);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [prices, setPrices] = useState<SeasonPrice[]>([]);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      roomService.getRooms(),
      roomService.getPrices(),
    ]).then(([allRooms, allPrices]) => {
      setRooms(allRooms.filter((r) => r.status === "available"));
      setPrices(allPrices);
    }).finally(() => setLoading(false));
  }, []);
  
  useEffect(() => {
    if (!form.roomId) return;
    const room = rooms.find((r) => r.id === form.roomId);
    const price = getRoomPrice(room, prices);
    if (price > 0) {
      const checkIn = new Date(form.checkIn);
      const checkOut = new Date(form.checkOut);
      const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000));
      setForm((f) => ({ ...f, totalAmount: price * nights }));
    }
  }, [form.roomId, form.checkIn, form.checkOut, rooms, prices]);

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.guestName.trim()) errs.guestName = "اسم النزيل مطلوب";
    if (!form.roomId) errs.roomId = "الغرفة مطلوبة";
    if (!form.checkIn) errs.checkIn = "تاريخ الدخول مطلوب";
    if (!form.checkOut) errs.checkOut = "تاريخ المغادرة مطلوب";
    if (form.checkIn && form.checkIn < new Date().toISOString().split("T")[0]) {
      errs.checkIn = "تاريخ الدخول لا يمكن أن يكون في الماضي";
    }
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
      errs.checkOut = "تاريخ المغادرة يجب أن يكون بعد تاريخ الدخول";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      await reservationService.create({
        guestName: form.guestName.trim(),
        guestPhone: form.guestPhone.trim(),
        roomId: form.roomId,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        status: "active",
        notes: form.notes.trim(),
        totalAmount: form.totalAmount,
      });
      await roomService.updateRoom(form.roomId, { status: "reserved" });
      logger.info("NewReservation: created");
      onBack();
    } catch (err) {
      logger.error("NewReservation: failed", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">حجز جديد</h3>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl rounded-xl border border-white/10 bg-card-bg p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-400">اسم النزيل</label>
            <input value={form.guestName} onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))}
              className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-sky-500", errors.guestName ? "border-red-400" : "border-white/20")} />
            {errors.guestName && <p className="mt-1 text-xs text-red-500">{errors.guestName}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">رقم الهاتف</label>
            <input value={form.guestPhone} onChange={(e) => setForm((f) => ({ ...f, guestPhone: e.target.value }))}
              className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">الغرفة</label>
            <select value={form.roomId} onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
              className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.roomId ? "border-red-400" : "border-white/20")}>
              <option value="">اختر الغرفة</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>غرفة {r.roomNumber} — طابق {r.floor}{r.typeId ? ` (${getRoomPrice(r, prices)} ‏د.م)` : ""}</option>)}
            </select>
            {errors.roomId && <p className="mt-1 text-xs text-red-500">{errors.roomId}</p>}
            {rooms.length === 0 && <p className="mt-1 text-xs text-amber-500">لا توجد غرف متاحة</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">تاريخ الدخول</label>
            <input type="date" value={form.checkIn} onChange={(e) => setForm((f) => ({ ...f, checkIn: e.target.value }))}
              className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.checkIn ? "border-red-400" : "border-white/20")} />
            {errors.checkIn && <p className="mt-1 text-xs text-red-500">{errors.checkIn}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">تاريخ المغادرة</label>
            <input type="date" value={form.checkOut} onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))}
              className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.checkOut ? "border-red-400" : "border-white/20")} />
            {errors.checkOut && <p className="mt-1 text-xs text-red-500">{errors.checkOut}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">المبلغ الإجمالي</label>
            <input type="number" min={0} value={form.totalAmount} onChange={(e) => setForm((f) => ({ ...f, totalAmount: Number(e.target.value) }))}
              className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
            {form.roomId && (() => {
              const room = rooms.find((r) => r.id === form.roomId);
              const price = getRoomPrice(room, prices);
              return price > 0 ? <p className="mt-1 text-[10px] text-slate-500">سعر الليلة: {price.toLocaleString()} ‏د.م (قابل للتعديل)</p> : null;
            })()}
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-400">ملاحظات</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" rows={2} />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button type="submit" loading={submitting || loading}>إنشاء الحجز</Button>
          <Button type="button" variant="outline" onClick={onBack}>إلغاء</Button>
        </div>
      </form>
    </div>
  );
}

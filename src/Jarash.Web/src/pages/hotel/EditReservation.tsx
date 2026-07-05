import { useState, useEffect, useCallback } from "react";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { roomService } from "./roomService";
import { reservationService } from "./reservationService";
import type { Reservation } from "./hotelTypes";
import { RESERVATION_STATUS_LABELS, RESERVATION_STATUS_COLORS } from "./hotelTypes";

export default function EditReservation({ onBack, selectedReservationId }: { onBack: () => void; selectedReservationId?: string }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [editId, setEditId] = useState<string | null>(selectedReservationId || null);
  const [editForm, setEditForm] = useState({ guestName: "", guestPhone: "", notes: "", totalAmount: 0 });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [rooms, setRooms] = useState<{ id: string; roomNumber: string }[]>([]);

  const load = useCallback(async () => {
    const [r, rm] = await Promise.all([reservationService.getAll(), roomService.getRooms()]);
    setReservations(r);
    setRooms(rm);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (selectedReservationId && reservations.length > 0) {
      const found = reservations.find((r) => r.id === selectedReservationId);
      if (found) startEdit(found);
    }
  }, [selectedReservationId, reservations]);

  function getRoomNumber(roomId: string): string {
    return rooms.find((r) => r.id === roomId)?.roomNumber ?? "—";
  }

  function startEdit(r: Reservation) {
    setEditId(r.id);
    setEditForm({ guestName: r.guestName, guestPhone: r.guestPhone, notes: r.notes, totalAmount: r.totalAmount });
    setErrors({});
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!editForm.guestName.trim()) errs.guestName = "الاسم مطلوب";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!editId || !validate()) return;
    await reservationService.update(editId, editForm);
    setEditId(null);
    await load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">تعديل الحجز <span className="text-sm font-normal text-slate-400">({reservations.length})</span></h3>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-slate-400">النزيل</th>
              <th className="px-4 py-3 text-right font-medium text-slate-400">الغرفة</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">الدخول</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">المغادرة</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">الحالة</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">المبلغ</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reservations.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">لا توجد حجوزات</td></tr>
            )}
            {reservations.map((r) => {
              const isEditing = editId === r.id;
              return (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  {isEditing ? (
                    <>
                      <td className="px-4 py-2">
                        <input value={editForm.guestName}
                          onChange={(e) => setEditForm((f) => ({ ...f, guestName: e.target.value }))}
                          className={cn("w-full rounded border px-2 py-1 text-sm outline-none focus:border-sky-500", errors.guestName ? "border-red-400" : "border-white/20")} />
                        {errors.guestName && <p className="text-xs text-red-500">{errors.guestName}</p>}
                      </td>
                      <td className="px-4 py-2 text-slate-500">{getRoomNumber(r.roomId)}</td>
                      <td className="px-4 py-2 text-center text-slate-500">{r.checkIn}</td>
                      <td className="px-4 py-2 text-center text-slate-500">{r.checkOut}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", RESERVATION_STATUS_COLORS[r.status])}>{RESERVATION_STATUS_LABELS[r.status]}</span>
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" min={0} value={editForm.totalAmount}
                          onChange={(e) => setEditForm((f) => ({ ...f, totalAmount: Number(e.target.value) }))}
                          className="w-20 rounded border border-white/20 px-2 py-1 text-center text-sm outline-none focus:border-sky-500" />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-center gap-1">
                          <button onClick={handleSave} className="rounded p-1.5 text-green-600 hover:bg-green-50 transition-colors" title="حفظ"><Save className="h-4 w-4" /></button>
                          <button onClick={() => setEditId(null)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 transition-colors" title="إلغاء"><X className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-white">{r.guestName}</td>
                      <td className="px-4 py-3 text-slate-500">{getRoomNumber(r.roomId)}</td>
                      <td className="px-4 py-3 text-center text-slate-500">{r.checkIn}</td>
                      <td className="px-4 py-3 text-center text-slate-500">{r.checkOut}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", RESERVATION_STATUS_COLORS[r.status])}>{RESERVATION_STATUS_LABELS[r.status]}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-300">{r.totalAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => startEdit(r)} className="rounded p-1.5 text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-colors" title="تعديل">تعديل</button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

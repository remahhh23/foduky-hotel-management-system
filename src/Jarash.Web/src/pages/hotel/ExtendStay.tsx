import { useState, useEffect, useCallback } from "react";
import { Clock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { roomService } from "./roomService";
import { reservationService } from "./reservationService";
import type { Reservation } from "./hotelTypes";
import { RESERVATION_STATUS_LABELS, RESERVATION_STATUS_COLORS } from "./hotelTypes";

export default function ExtendStay({ onBack, selectedReservationId }: { onBack: () => void; selectedReservationId?: string }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<{ id: string; roomNumber: string }[]>([]);
  const [extendMap, setExtendMap] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [r, rm] = await Promise.all([reservationService.getActive(), roomService.getRooms()]);
    setReservations(r);
    setRooms(rm);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (selectedReservationId && reservations.length > 0) {
      const found = reservations.find((r) => r.id === selectedReservationId);
      if (found) {
        const nextDay = new Date(found.checkOut);
        nextDay.setDate(nextDay.getDate() + 1);
        setExtendMap((m) => ({ ...m, [found.id]: nextDay.toISOString().split("T")[0] }));
      }
    }
  }, [selectedReservationId, reservations]);

  async function handleExtend(id: string) {
    const newDate = extendMap[id];
    if (!newDate) return;
    await reservationService.extendStay(id, newDate);
    setExtendMap((m) => { const c = { ...m }; delete c[id]; return c; });
    await load();
  }

  function getRoomNumber(roomId: string): string {
    return rooms.find((r) => r.id === roomId)?.roomNumber ?? "—";
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">تمديد الإقامة <span className="text-sm font-normal text-slate-400">({reservations.length})</span></h3>
      </div>

      <p className="mb-4 text-sm text-slate-500">اختر الحجز الذي تريد تمديد مدة إقامته</p>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-slate-400">النزيل</th>
              <th className="px-4 py-3 text-right font-medium text-slate-400">الغرفة</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">تاريخ المغادرة الحالي</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">تاريخ المغادرة الجديد</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">الحالة</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400 w-20"></th>
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
                <td className="px-4 py-3 text-center font-semibold text-slate-300">{r.checkOut}</td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="date"
                    min={r.checkOut}
                    value={extendMap[r.id] ?? ""}
                    onChange={(e) => setExtendMap((m) => ({ ...m, [r.id]: e.target.value }))}
                    className="w-36 rounded-lg border border-white/20 px-2 py-1.5 text-sm outline-none focus:border-sky-500"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", RESERVATION_STATUS_COLORS[r.status])}>{RESERVATION_STATUS_LABELS[r.status]}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleExtend(r.id)}
                    disabled={!extendMap[r.id]}
                    className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-600 hover:bg-sky-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="h-4 w-4" /> حفظ
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

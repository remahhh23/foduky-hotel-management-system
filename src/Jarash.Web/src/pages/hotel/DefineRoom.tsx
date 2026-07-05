import { useState, useEffect, useCallback } from "react";
import { Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { roomService } from "./roomService";
import type { Room, RoomStatus } from "./hotelTypes";
import { ROOM_STATUS_LABELS, ROOM_STATUS_COLORS } from "./hotelTypes";

const emptyForm = { roomNumber: "", floor: 1, typeId: "", status: "available" as RoomStatus, notes: "" };

export default function DefineRoom({ onBack }: { onBack: () => void }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<{ id: string; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const load = useCallback(async () => {
    const [r, rt] = await Promise.all([roomService.getRooms(), roomService.getRoomTypes()]);
    setRooms(r);
    setRoomTypes(rt);
  }, []);

  useEffect(() => { load(); }, [load]);

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.roomNumber.trim()) errs.roomNumber = "رقم الغرفة مطلوب";
    if (!form.typeId) errs.typeId = "نوع الغرفة مطلوب";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (editId) {
        await roomService.updateRoom(editId, form);
      } else {
        await roomService.addRoom(form);
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
      setErrors({});
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "فشل الحفظ";
      setErrors((prev) => ({ ...prev, roomNumber: msg }));
      logger.error("DefineRoom: save failed", err);
    }
  }

  function handleEdit(r: Room) {
    setEditId(r.id);
    setForm({ roomNumber: r.roomNumber, floor: r.floor, typeId: r.typeId, status: r.status, notes: r.notes });
    setShowForm(true);
    setErrors({});
  }

  async function handleDelete(id: string) {
    if (!confirm("تأكيد حذف هذه الغرفة؟")) return;
    await roomService.deleteRoom(id);
    await load();
  }

  const getTypeName = (id: string) => roomTypes.find((t) => t.id === id)?.name ?? id;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
          <h3 className="text-lg font-bold text-white">تعريف الغرف <span className="text-sm font-normal text-slate-400">({rooms.length})</span></h3>
        </div>
        <Button size="sm" onClick={() => { setEditId(null); setForm(emptyForm); setErrors({}); setShowForm(true); }}>
          إضافة غرفة
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-white/10 bg-card-bg p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">رقم الغرفة</label>
              <input
                value={form.roomNumber}
                onChange={(e) => setForm((f) => ({ ...f, roomNumber: e.target.value }))}
                className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-sky-500", errors.roomNumber ? "border-red-400" : "border-white/20")}
              />
              {errors.roomNumber && <p className="mt-1 text-xs text-red-500">{errors.roomNumber}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">الطابق</label>
              <input
                type="number"
                value={form.floor}
                onChange={(e) => setForm((f) => ({ ...f, floor: Number(e.target.value) }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">نوع الغرفة</label>
              <select
                value={form.typeId}
                onChange={(e) => setForm((f) => ({ ...f, typeId: e.target.value }))}
                className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.typeId ? "border-red-400" : "border-white/20")}
              >
                <option value="">اختر النوع</option>
                {roomTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {errors.typeId && <p className="mt-1 text-xs text-red-500">{errors.typeId}</p>}
              {roomTypes.length === 0 && <p className="mt-1 text-xs text-amber-500">يجب إضافة أنواع غرف أولاً</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">الحالة</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as RoomStatus }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500"
              >
                {Object.entries(ROOM_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-400">ملاحظات</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500"
                rows={2}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" size="sm">{editId ? "تحديث" : "إضافة"}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); setErrors({}); }}>إلغاء</Button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-slate-400">رقم الغرفة</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">الطابق</th>
              <th className="px-4 py-3 text-right font-medium text-slate-400">النوع</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">الحالة</th>
              <th className="px-4 py-3 text-right font-medium text-slate-400">ملاحظات</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rooms.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">لا توجد غرف بعد</td></tr>
            )}
            {rooms.map((r) => (
              <tr key={r.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{r.roomNumber}</td>
                <td className="px-4 py-3 text-center text-slate-500">{r.floor}</td>
                <td className="px-4 py-3 text-slate-400">{getTypeName(r.typeId)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", ROOM_STATUS_COLORS[r.status])}>
                    {ROOM_STATUS_LABELS[r.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{r.notes || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => handleEdit(r)} className="rounded p-1.5 text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-colors" title="تعديل"><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(r.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="حذف"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

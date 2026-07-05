import { useState, useEffect, useCallback } from "react";
import { Plus, Edit3, Trash2, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { roomService } from "./roomService";
import type { RoomType } from "./hotelTypes";

const emptyForm = { name: "", description: "", maxGuests: 1, amenities: [] as string[] };

export default function RoomTypes({ onBack }: { onBack: () => void }) {
  const [types, setTypes] = useState<RoomType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [amenityInput, setAmenityInput] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  const load = useCallback(async () => {
    const data = await roomService.getRoomTypes();
    setTypes(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = "الاسم مطلوب";
    if (form.maxGuests < 1) errs.maxGuests = "عدد النزلاء يجب أن يكون 1 على الأقل";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (editId) {
        await roomService.updateRoomType(editId, form);
      } else {
        await roomService.addRoomType(form);
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
      setErrors({});
      await load();
    } catch (err) {
      logger.error("RoomTypes: save failed", err);
    }
  }

  function handleEdit(t: RoomType) {
    setEditId(t.id);
    setForm({ name: t.name, description: t.description, maxGuests: t.maxGuests, amenities: t.amenities });
    setShowForm(true);
    setErrors({});
  }

  async function handleDelete(id: string) {
    const rooms = await roomService.getRooms();
    const roomsUsing = rooms.filter((r) => r.typeId === id);
    if (roomsUsing.length > 0) {
      alert(`لا يمكن حذف هذا النوع لأنه مستخدم في ${roomsUsing.length} غرفة`);
      return;
    }
    if (!confirm("تأكيد حذف هذا النوع؟")) return;
    await roomService.deleteRoomType(id);
    await load();
  }

  function addAmenity() {
    const val = amenityInput.trim();
    if (val && !form.amenities.includes(val)) {
      setForm((f) => ({ ...f, amenities: [...f.amenities, val] }));
    }
    setAmenityInput("");
  }

  function removeAmenity(a: string) {
    setForm((f) => ({ ...f, amenities: f.amenities.filter((x) => x !== a) }));
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
          <h3 className="text-lg font-bold text-white">أنواع الغرف <span className="text-sm font-normal text-slate-400">({types.length})</span></h3>
        </div>
        <Button size="sm" onClick={() => { setEditId(null); setForm(emptyForm); setErrors({}); setShowForm(true); }}>
          <Plus className="h-4 w-4 ml-1" /> إضافة نوع
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-white/10 bg-card-bg p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">الاسم</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-sky-500", errors.name ? "border-red-400" : "border-white/20")}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">عدد النزلاء</label>
              <input
                type="number" min={1}
                value={form.maxGuests}
                onChange={(e) => setForm((f) => ({ ...f, maxGuests: Math.max(1, Number(e.target.value)) }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-400">الوصف</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500"
                rows={2}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-400">المرافق</label>
              <div className="flex gap-2 mb-2">
                <input
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAmenity())}
                  placeholder="أضف مرفقاً..."
                  className="flex-1 rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
                <Button type="button" size="sm" variant="outline" onClick={addAmenity}>إضافة</Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.amenities.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs text-sky-700">
                    <Sparkles className="h-3 w-3" /> {a}
                    <button type="button" onClick={() => removeAmenity(a)} className="text-sky-400 hover:text-red-500">&times;</button>
                  </span>
                ))}
              </div>
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
              <th className="px-4 py-3 text-right font-medium text-slate-400">الاسم</th>
              <th className="px-4 py-3 text-right font-medium text-slate-400">الوصف</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">النزلاء</th>
              <th className="px-4 py-3 text-right font-medium text-slate-400">المرافق</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {types.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">لا توجد أنواع غرف بعد</td></tr>
            )}
            {types.map((t) => (
              <tr key={t.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{t.name}</td>
                <td className="px-4 py-3 text-slate-500">{t.description || "—"}</td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1 text-slate-400"><Users className="h-3.5 w-3.5" />{t.maxGuests}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {t.amenities.map((a) => (
                      <span key={a} className="rounded bg-sky-50 px-2 py-0.5 text-[11px] text-sky-600">{a}</span>
                    ))}
                    {t.amenities.length === 0 && <span className="text-slate-400">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => handleEdit(t)} className="rounded p-1.5 text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-colors" title="تعديل"><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(t.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="حذف"><Trash2 className="h-4 w-4" /></button>
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

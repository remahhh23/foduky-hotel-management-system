import { useState, useEffect, useCallback } from "react";
import { Edit3, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { servicesService } from "./servicesService";
import { SERVICE_TYPE_LABELS, SERVICE_STATUS_LABELS, SERVICE_STATUS_COLORS } from "./hotelTypes";
import { getOccupiedRooms } from "./hotelUtils";
import type { ServiceRequest, ServiceType } from "./hotelTypes";
import type { OccupiedRoom } from "./hotelUtils";

const emptyForm = { guestName: "", roomNumber: "", item: "", quantity: 1, amount: 0, notes: "" };

export default function ServiceRequestPage({ onBack, serviceType }: { onBack: () => void; serviceType: ServiceType }) {
  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [occupiedRooms, setOccupiedRooms] = useState<OccupiedRoom[]>([]);

  const load = useCallback(async () => {
    const [svc, rooms] = await Promise.all([
      servicesService.getByType(serviceType),
      getOccupiedRooms(),
    ]);
    setItems(svc);
    setOccupiedRooms(rooms);
  }, [serviceType]);

  useEffect(() => { load(); }, [load]);

  function handleRoomSelect(roomNumber: string) {
    const found = occupiedRooms.find((r) => r.roomNumber === roomNumber);
    setForm((f) => ({ ...f, roomNumber: found?.roomNumber ?? "", guestName: found?.guestName ?? "" }));
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.roomNumber.trim()) errs.roomNumber = "الغرفة مطلوبة";
    if (!form.guestName.trim()) errs.guestName = "اسم النزيل مطلوب";
    if (!form.item.trim()) errs.item = "الخدمة مطلوبة";
    if (form.quantity < 1) errs.quantity = "الكمية يجب أن تكون 1 على الأقل";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (editId) {
        await servicesService.update(editId, form);
      } else {
        await servicesService.create({ ...form, serviceType, status: "pending" });
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
      setErrors({});
      await load();
    } catch (err) {
      logger.error("ServiceRequestPage: save failed", err);
    }
  }

  function handleEdit(s: ServiceRequest) {
    setEditId(s.id);
    setForm({ guestName: s.guestName, roomNumber: s.roomNumber, item: s.item, quantity: s.quantity, amount: s.amount, notes: s.notes });
    setShowForm(true);
    setErrors({});
  }

  async function handleDelete(id: string) {
    if (!confirm("تأكيد حذف هذا الطلب؟")) return;
    await servicesService.delete(id);
    await load();
  }

  async function handleComplete(id: string) {
    await servicesService.complete(id);
    await load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
          <h3 className="text-lg font-bold text-white">{SERVICE_TYPE_LABELS[serviceType]} <span className="text-sm font-normal text-slate-400">({items.length})</span></h3>
        </div>
        <Button size="sm" onClick={() => { setEditId(null); setForm(emptyForm); setErrors({}); setShowForm(true); }}>
          طلب جديد
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-white/10 bg-card-bg p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">الغرفة</label>
              <select
                value={form.roomNumber}
                onChange={(e) => handleRoomSelect(e.target.value)}
                className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-sky-500", errors.roomNumber ? "border-red-400" : "border-white/20")}
              >
                <option value="">اختر الغرفة</option>
                {occupiedRooms.map((r) => (
                  <option key={r.roomNumber} value={r.roomNumber}>غرفة {r.roomNumber} — {r.guestName}</option>
                ))}
              </select>
              {errors.roomNumber && <p className="mt-1 text-xs text-red-500">{errors.roomNumber}</p>}
              {occupiedRooms.length === 0 && <p className="mt-1 text-xs text-amber-500">لا توجد غرف مشغولة</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">اسم النزيل</label>
              <input value={form.guestName} readOnly
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 outline-none" />
              {errors.guestName && <p className="mt-1 text-xs text-red-500">{errors.guestName}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">الخدمة</label>
              <input value={form.item} onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))}
                className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.item ? "border-red-400" : "border-white/20")} />
              {errors.item && <p className="mt-1 text-xs text-red-500">{errors.item}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">الكمية</label>
              <input type="number" min={1} value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: Math.max(1, Number(e.target.value)) }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">المبلغ</label>
              <input type="number" min={0} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">ملاحظات</label>
              <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
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
              <th className="px-4 py-3 text-right font-medium text-slate-400">النزيل</th>
              <th className="px-4 py-3 text-right font-medium text-slate-400">الغرفة</th>
              <th className="px-4 py-3 text-right font-medium text-slate-400">الخدمة</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">الكمية</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">المبلغ</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">الحالة</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400 w-28"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">لا توجد طلبات بعد</td></tr>
            )}
            {items.map((s) => (
              <tr key={s.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{s.guestName}</td>
                <td className="px-4 py-3 text-slate-500">{s.roomNumber}</td>
                <td className="px-4 py-3 text-slate-400">{s.item}</td>
                <td className="px-4 py-3 text-center text-slate-400">{s.quantity}</td>
                <td className="px-4 py-3 text-center text-slate-400">{s.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", SERVICE_STATUS_COLORS[s.status])}>
                    {SERVICE_STATUS_LABELS[s.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    {s.status === "pending" && (
                      <button onClick={() => handleComplete(s.id)} className="rounded p-1.5 text-slate-400 hover:bg-green-50 hover:text-green-600 transition-colors" title="إتمام">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    {s.status === "pending" && (
                      <button onClick={() => handleEdit(s)} className="rounded p-1.5 text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-colors" title="تعديل">
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(s.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="حذف">
                      <Trash2 className="h-4 w-4" />
                    </button>
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

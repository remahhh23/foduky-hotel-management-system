import { useState, useEffect, useCallback } from "react";
import { Plus, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { customerService } from "./accountsService";
import type { Customer } from "./accountsTypes";

const emptyForm = { name: "", phone: "", email: "", address: "", taxId: "", creditLimit: 0, notes: "" };

export default function CustomersPage({ onBack }: { onBack: () => void }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const load = useCallback(() => { setCustomers(customerService.getAll()); }, []);
  useEffect(() => { load(); }, [load]);

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = "الاسم مطلوب";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (editId) customerService.update(editId, form);
      else customerService.create(form);
      setShowForm(false); setEditId(null); setForm(emptyForm); setErrors({}); load();
    } catch (err) { logger.error("CustomersPage: save failed", err); }
  }

  function handleEdit(c: Customer) {
    setEditId(c.id); setForm({ name: c.name, phone: c.phone, email: c.email, address: c.address, taxId: c.taxId, creditLimit: c.creditLimit, notes: c.notes });
    setShowForm(true); setErrors({});
  }

  function handleDelete(id: string) {
    if (!confirm("تأكيد حذف هذا العميل؟")) return;
    customerService.delete(id); load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
          <h3 className="text-lg font-bold text-white">إدارة العملاء</h3>
        </div>
        <Button size="sm" onClick={() => { setEditId(null); setForm(emptyForm); setErrors({}); setShowForm(true); }}><Plus className="h-4 w-4 ml-1" /> إضافة عميل</Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-white/10 bg-card-bg p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="mb-1 block text-xs font-medium text-slate-400">اسم العميل</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.name ? "border-red-400" : "border-white/20")} />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}</div>
            <div><label className="mb-1 block text-xs font-medium text-slate-400">رقم الهاتف</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
            <div><label className="mb-1 block text-xs font-medium text-slate-400">البريد الإلكتروني</label>
              <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
            <div><label className="mb-1 block text-xs font-medium text-slate-400">الرقم الضريبي</label>
              <input value={form.taxId} onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
            <div><label className="mb-1 block text-xs font-medium text-slate-400">حد الائتمان</label>
              <input type="number" min={0} value={form.creditLimit} onChange={(e) => setForm((f) => ({ ...f, creditLimit: Number(e.target.value) }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
            <div><label className="mb-1 block text-xs font-medium text-slate-400">ملاحظات</label>
              <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
            <div className="md:col-span-2"><label className="mb-1 block text-xs font-medium text-slate-400">العنوان</label>
              <textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" rows={2} /></div>
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
            <tr><th className="px-4 py-3 text-right font-medium text-slate-400">الاسم</th><th className="px-4 py-3 text-right font-medium text-slate-400">الهاتف</th><th className="px-4 py-3 text-right font-medium text-slate-400">البريد</th><th className="px-4 py-3 text-center font-medium text-slate-400">حد الائتمان</th><th className="px-4 py-3 text-center font-medium text-slate-400 w-20"></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">لا يوجد عملاء بعد</td></tr>}
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                <td className="px-4 py-3 text-slate-500">{c.phone || "—"}</td>
                <td className="px-4 py-3 text-slate-500">{c.email || "—"}</td>
                <td className="px-4 py-3 text-center text-slate-400">{c.creditLimit > 0 ? c.creditLimit.toLocaleString() : "—"}</td>
                <td className="px-4 py-3"><div className="flex justify-center gap-1">
                  <button onClick={() => handleEdit(c)} className="rounded p-1.5 text-slate-400 hover:bg-sky-50 hover:text-sky-600"><Edit3 className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(c.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

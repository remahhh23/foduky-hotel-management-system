import { useState, useEffect, useCallback } from "react";
import { Plus, Edit3, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { supplierService, purchaseOrderService, purchaseInvoiceService, supplierPaymentService } from "./purchasesService";
import { ensureAccount } from "@/lib/integration";
import type { Supplier } from "./purchasesTypes";

const emptyForm = { name: "", phone: "", email: "", address: "", taxId: "", notes: "" };

export default function SuppliersPage({ onBack }: { onBack: () => void }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const load = useCallback(() => {
    const all = supplierService.getAll();
    setSuppliers(all);
    logger.info("SuppliersPage: loaded", { count: all.length });
  }, []);

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
      if (editId) {
        supplierService.update(editId, form);
      } else {
        const newSupplier = supplierService.create(form);
        const supCode = newSupplier.id.includes("_") ? newSupplier.id.split("_")[1]?.substring(0,8) || newSupplier.id.substring(0,8) : newSupplier.id.substring(0,8);
        ensureAccount(`2010${supCode}`, `دائن ${form.name}`, "liability");
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
      setErrors({});
      load();
    } catch (err) {
      logger.error("SuppliersPage: save failed", err);
    }
  }

  function handleEdit(s: Supplier) {
    setEditId(s.id);
    setForm({ name: s.name, phone: s.phone, email: s.email, address: s.address, taxId: s.taxId, notes: s.notes });
    setShowForm(true);
    setErrors({});
  }

  function handleDelete(id: string) {
    const linkedOrders = purchaseOrderService.getAll().filter((o) => o.supplierId === id).length;
    const linkedInvoices = purchaseInvoiceService.getAll().filter((i) => i.supplierId === id).length;
    const linkedPayments = supplierPaymentService.getAll().filter((p) => p.supplierId === id).length;
    if (linkedOrders > 0 || linkedInvoices > 0 || linkedPayments > 0) {
      alert(`لا يمكن حذف المورد. لديه ${linkedOrders} أمر شراء، ${linkedInvoices} فاتورة، ${linkedPayments} دفعة.`);
      return;
    }
    if (!confirm("تأكيد حذف هذا المورد؟")) return;
    supplierService.delete(id);
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
          <h3 className="text-lg font-bold text-white">إدارة الموردين</h3>
        </div>
        <Button size="sm" onClick={() => { setEditId(null); setForm(emptyForm); setErrors({}); setShowForm(true); }}>
          <Plus className="h-4 w-4 ml-1" /> إضافة مورد
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-white/10 bg-card-bg p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">اسم المورد</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-sky-500", errors.name ? "border-red-400" : "border-white/20")} />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">رقم الهاتف</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">البريد الإلكتروني</label>
              <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">الرقم الضريبي</label>
              <input value={form.taxId} onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-400">العنوان</label>
              <textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" rows={2} />
            </div>
            <div className="md:col-span-2">
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

      <div className="mb-4 flex items-center gap-2">
        <Search className="h-4 w-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث عن مورد..."
          className="w-full max-w-xs rounded-lg border border-white/20 px-3 py-1.5 text-sm outline-none focus:border-sky-500" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-slate-400">الاسم</th>
              <th className="px-4 py-3 text-right font-medium text-slate-400">الهاتف</th>
              <th className="px-4 py-3 text-right font-medium text-slate-400">البريد</th>
              <th className="px-4 py-3 text-right font-medium text-slate-400">الرقم الضريبي</th>
              <th className="px-4 py-3 text-right font-medium text-slate-400">العنوان</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">لا يوجد موردون بعد</td></tr>
            )}
            {suppliers.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase())).map((s) => (
              <tr key={s.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                <td className="px-4 py-3 text-slate-500">{s.phone || "—"}</td>
                <td className="px-4 py-3 text-slate-500">{s.email || "—"}</td>
                <td className="px-4 py-3 text-slate-500">{s.taxId || "—"}</td>
                <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{s.address || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => handleEdit(s)} className="rounded p-1.5 text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-colors" title="تعديل">
                      <Edit3 className="h-4 w-4" />
                    </button>
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

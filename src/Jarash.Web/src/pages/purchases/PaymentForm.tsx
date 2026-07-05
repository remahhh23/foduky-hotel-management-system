import { useState, useEffect, useCallback } from "react";
import { Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { supplierPaymentService, supplierService } from "./purchasesService";
import { PAYMENT_TYPE_LABELS, PAYMENT_TYPE_COLORS } from "./purchasesTypes";
import { recordExternalPayment, recordExternalReceipt } from "@/lib/integration";
import type { SupplierPayment, Supplier } from "./purchasesTypes";

interface PaymentFormProps {
  onBack: () => void;
  type: "payment" | "voucher";
  title: string;
  addLabel: string;
  submitLabel: string;
  deleteConfirm: string;
  emptyState: string;
  referenceLabel: string;
  amountColor: string;
}

const emptyForm = { supplierId: "", supplierName: "", amount: 0, date: new Date().toISOString().split("T")[0], reference: "", notes: "" };

export default function PaymentForm({
  onBack, type, title, addLabel, submitLabel, deleteConfirm, emptyState, referenceLabel, amountColor,
}: PaymentFormProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<SupplierPayment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const load = useCallback(() => {
    setSuppliers(supplierService.getAll());
    setItems(supplierPaymentService.getByType(type));
  }, [type]);

  useEffect(() => { load(); }, [load]);

  function handleSupplierChange(id: string) {
    const s = suppliers.find((s) => s.id === id);
    setForm((f) => ({ ...f, supplierId: id, supplierName: s?.name ?? "" }));
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.supplierId) errs.supplierId = "المورد مطلوب";
    if (form.amount <= 0) errs.amount = "المبلغ يجب أن يكون أكبر من صفر";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (editId) {
        supplierPaymentService.update(editId, form);
      } else {
        const payment = supplierPaymentService.create({ ...form, type });
        recordExternalPayment(
          `دفع للمورد ${form.supplierName}`,
          form.amount,
          form.supplierName,
          form.reference,
          form.date,
        );
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
      setErrors({});
      load();
    } catch (err) {
      logger.error("PaymentForm: save failed", err);
    }
  }

  function handleEdit(p: SupplierPayment) {
    setEditId(p.id);
    setForm({ supplierId: p.supplierId, supplierName: p.supplierName, amount: p.amount, date: p.date, reference: p.reference, notes: p.notes });
    setShowForm(true);
    setErrors({});
  }

  function handleDelete(id: string) {
    if (!confirm(deleteConfirm)) return;
    const payment = items.find((p) => p.id === id);
    supplierPaymentService.delete(id);
    if (payment) {
      recordExternalReceipt(
        `إلغاء ${type === "payment" ? "دفعة" : "سند صرف"} - ${payment.reference || ""}`,
        payment.amount,
        payment.supplierName,
        payment.reference,
        new Date().toISOString().split("T")[0],
      );
    }
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        </div>
        <Button size="sm" onClick={() => { setEditId(null); setForm(emptyForm); setErrors({}); setShowForm(true); }}>
          {addLabel}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">المورد</label>
              <select value={form.supplierId} onChange={(e) => handleSupplierChange(e.target.value)}
                className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.supplierId ? "border-red-400" : "border-slate-300")}>
                <option value="">اختر المورد</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {errors.supplierId && <p className="mt-1 text-xs text-red-500">{errors.supplierId}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">المبلغ</label>
              <input type="number" min={0} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.amount ? "border-red-400" : "border-slate-300")} />
              {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">التاريخ</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">{referenceLabel}</label>
              <input value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">ملاحظات</label>
              <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" size="sm">{editId ? "تحديث" : submitLabel}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); setErrors({}); }}>إلغاء</Button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-slate-600">المورد</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">المبلغ</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">التاريخ</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">{referenceLabel}</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">النوع</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">{emptyState}</td></tr>
            )}
            {items.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">{p.supplierName}</td>
                <td className={cn("px-4 py-3 text-center font-medium", amountColor)}>{p.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-center text-slate-600">{p.date}</td>
                <td className="px-4 py-3 text-center text-slate-500">{p.reference || "—"}</td>
                <td className="px-4 py-3">
                  <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", PAYMENT_TYPE_COLORS[p.type])}>
                    {PAYMENT_TYPE_LABELS[p.type]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => handleEdit(p)} className="rounded p-1.5 text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-colors" title="تعديل">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="حذف">
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

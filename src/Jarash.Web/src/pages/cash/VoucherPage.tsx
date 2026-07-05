import { useState, useEffect, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { cashFundService, cashTransactionService } from "./cashService";
import { VOUCHER_TYPE_LABELS, VOUCHER_TYPE_COLORS } from "./cashTypes";
import { createJournalFromCashTransaction } from "@/lib/integration";
import type { CashFund, CashTransaction, VoucherType } from "./cashTypes";

const emptyForm = { fundId: "", fundName: "", amount: 0, description: "", reference: "", counterparty: "", notes: "", date: new Date().toISOString().split("T")[0] };

export default function VoucherPage({ onBack, voucherType }: { onBack: () => void; voucherType: VoucherType }) {
  const [openFunds, setOpenFunds] = useState<CashFund[]>([]);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const load = useCallback(() => {
    setOpenFunds(cashFundService.getOpen());
    setTransactions(cashTransactionService.getByType(voucherType));
  }, [voucherType]);

  useEffect(() => { load(); }, [load]);

  function handleFundChange(fundId: string) {
    const f = openFunds.find((f) => f.id === fundId);
    setForm((prev) => ({ ...prev, fundId, fundName: f?.name ?? "" }));
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.fundId) errs.fundId = "الصندوق مطلوب";
    if (!form.description.trim()) errs.description = "البيان مطلوب";
    if (form.amount <= 0) errs.amount = "المبلغ يجب أن يكون أكبر من صفر";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      const txn = cashTransactionService.create({ ...form, type: voucherType });
      createJournalFromCashTransaction(txn);
      setShowForm(false);
      setForm(emptyForm);
      setErrors({});
      load();
    } catch (err) {
      logger.error("VoucherPage: save failed", err);
    }
  }

  function handleDelete(id: string) {
    if (!confirm("تأكيد حذف هذا السند؟")) return;
    cashTransactionService.delete(id);
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
          <h3 className="text-lg font-bold text-white">{VOUCHER_TYPE_LABELS[voucherType]}</h3>
        </div>
        <Button size="sm" onClick={() => { setForm(emptyForm); setErrors({}); setShowForm(true); }}>
          إضافة {VOUCHER_TYPE_LABELS[voucherType]}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-white/10 bg-card-bg p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">الصندوق</label>
              <select value={form.fundId} onChange={(e) => handleFundChange(e.target.value)}
                className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.fundId ? "border-red-400" : "border-white/20")}>
                <option value="">اختر الصندوق</option>
                {openFunds.map((f) => <option key={f.id} value={f.id}>{f.name} (الرصيد: {f.currentBalance.toLocaleString()})</option>)}
              </select>
              {errors.fundId && <p className="mt-1 text-xs text-red-500">{errors.fundId}</p>}
              {openFunds.length === 0 && <p className="mt-1 text-xs text-amber-500">لا توجد صناديق مفتوحة</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">المبلغ</label>
              <input type="number" min={0} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.amount ? "border-red-400" : "border-white/20")} />
              {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">التاريخ</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">رقم المرجع</label>
              <input value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">الطرف</label>
              <input value={form.counterparty} onChange={(e) => setForm((f) => ({ ...f, counterparty: e.target.value }))} placeholder="الجهة المقابلة"
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">ملاحظات</label>
              <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-400">البيان</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.description ? "border-red-400" : "border-white/20")} rows={2} />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" size="sm">إضافة</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setShowForm(false); setForm(emptyForm); setErrors({}); }}>إلغاء</Button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-slate-400">التاريخ</th>
              <th className="px-4 py-3 text-right font-medium text-slate-400">الصندوق</th>
              <th className="px-4 py-3 text-right font-medium text-slate-400">البيان</th>
              <th className="px-4 py-3 text-right font-medium text-slate-400">الطرف</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">المرجع</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">المبلغ</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">لا توجد سندات</td></tr>
            )}
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-slate-400">{t.date}</td>
                <td className="px-4 py-3 font-medium text-white">{t.fundName}</td>
                <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">{t.description}</td>
                <td className="px-4 py-3 text-slate-500">{t.counterparty || "—"}</td>
                <td className="px-4 py-3 text-center text-slate-500">{t.reference || "—"}</td>
                <td className="px-4 py-3 text-center font-medium text-green-600">{t.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handleDelete(t.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="حذف">
                    <Trash2 className="h-4 w-4" />
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

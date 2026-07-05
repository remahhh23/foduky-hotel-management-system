import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { supplierPaymentService, supplierService, purchaseInvoiceService } from "./purchasesService";
import { recordExternalPayment, ensureAccount } from "@/lib/integration";
import { journalEntryService } from "@/pages/accounts/accountsService";
import type { Supplier } from "./purchasesTypes";

export default function AccountSettlement({ onBack }: { onBack: () => void }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [amount, setAmount] = useState(0);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [balanceInfo, setBalanceInfo] = useState({ invoicesTotal: 0, paidTotal: 0, balance: 0 });

  const loadSuppliers = useCallback(() => {
    setSuppliers(supplierService.getAll());
  }, []);

  useEffect(() => { loadSuppliers(); }, [loadSuppliers]);

  function loadBalance(supplierId: string) {
    setSelectedId(supplierId);
    if (!supplierId) { setBalanceInfo({ invoicesTotal: 0, paidTotal: 0, balance: 0 }); return; }
    const invoices = purchaseInvoiceService.getAll().filter((i) => i.supplierId === supplierId);
    const payments = supplierPaymentService.getAll().filter((p) => p.supplierId === supplierId);
    const invoicesTotal = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const paidFromPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    setBalanceInfo({
      invoicesTotal,
      paidTotal: paidFromPayments,
      balance: invoicesTotal - paidFromPayments,
    });
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!selectedId) errs.selectedId = "المورد مطلوب";
    if (amount <= 0) errs.amount = "المبلغ يجب أن يكون أكبر من صفر";
    if (amount > balanceInfo.balance) errs.amount = "المبلغ يتجاوز الرصيد المطلوب";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      const s = suppliers.find((s) => s.id === selectedId);
      const supName = s?.name ?? "";
      supplierPaymentService.create({
        type: "settlement", supplierId: selectedId, supplierName: supName,
        amount, date: new Date().toISOString().split("T")[0], reference, notes,
      });
      recordExternalPayment(
        `تسوية حساب المورد ${supName}`,
        amount,
        supName,
        reference,
        new Date().toISOString().split("T")[0],
      );
      const supCode = selectedId.includes("_") ? selectedId.split("_")[1]?.substring(0,8) || selectedId.substring(0,8) : selectedId.substring(0,8);
      const supAccountId = ensureAccount(`2010${supCode}`, `دائن ${supName}`, "liability");
      const expensesAccountId = ensureAccount("500001", "مصروفات متنوعة", "expense");
      journalEntryService.create({
        date: new Date().toISOString().split("T")[0],
        memo: `تسوية حساب ${supName}`,
        lines: [
          { id: "1", accountId: expensesAccountId, accountName: "مصروفات متنوعة", description: "", debit: amount, credit: 0 },
          { id: "2", accountId: supAccountId, accountName: `دائن ${supName}`, description: "", debit: 0, credit: amount },
        ],
        status: "posted",
      });
      const pendingInvoices = purchaseInvoiceService.getAll()
        .filter((i) => i.supplierId === selectedId && i.status === "pending");
      let remaining = amount;
      for (const inv of pendingInvoices) {
        if (remaining <= 0) break;
        purchaseInvoiceService.update(inv.id, {
          paidAmount: inv.paidAmount + Math.min(inv.totalAmount - inv.paidAmount, remaining),
          status: remaining >= (inv.totalAmount - inv.paidAmount) ? "paid" : "pending",
        });
        remaining -= (inv.totalAmount - inv.paidAmount);
      }
      logger.info("AccountSettlement: created");
      setAmount(0);
      setReference("");
      setNotes("");
      loadBalance(selectedId);
    } catch (err) {
      logger.error("AccountSettlement: failed", err);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">تسوية الحسابات</h3>
      </div>

      <div className="mb-6 max-w-md">
        <label className="mb-1 block text-xs font-medium text-slate-400">اختر المورد</label>
        <select value={selectedId} onChange={(e) => loadBalance(e.target.value)}
          className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.selectedId ? "border-red-400" : "border-white/20")}>
          <option value="">اختر المورد</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {errors.selectedId && <p className="mt-1 text-xs text-red-500">{errors.selectedId}</p>}
        {suppliers.length === 0 && <p className="mt-1 text-xs text-amber-500">لا يوجد موردون</p>}
      </div>

      {selectedId && (
        <>
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/10 bg-card-bg p-4 shadow-sm">
              <div className="text-xs text-slate-500 mb-1">إجمالي الفواتير</div>
              <div className="text-xl font-bold text-white">{balanceInfo.invoicesTotal.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-card-bg p-4 shadow-sm">
              <div className="text-xs text-slate-500 mb-1">إجمالي المدفوعات</div>
              <div className="text-xl font-bold text-green-600">{balanceInfo.paidTotal.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-card-bg p-4 shadow-sm">
              <div className="text-xs text-slate-500 mb-1">الرصيد المتبقي</div>
              <div className={cn("text-xl font-bold", balanceInfo.balance <= 0 ? "text-green-600" : "text-red-600")}>
                {balanceInfo.balance.toLocaleString()}
              </div>
            </div>
          </div>

          {balanceInfo.balance > 0 && (
            <form onSubmit={handleSubmit} className="max-w-2xl rounded-xl border border-white/10 bg-card-bg p-6 shadow-sm">
              <h4 className="text-sm font-bold text-white mb-4">تسديد الرصيد المتبقي</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">المبلغ</label>
                  <input type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))}
                    className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.amount ? "border-red-400" : "border-white/20")} />
                  {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">رقم المرجع</label>
                  <input value={reference} onChange={(e) => setReference(e.target.value)}
                    className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-400">ملاحظات</label>
                  <input value={notes} onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <Button type="submit">تسوية الحساب</Button>
                <Button type="button" variant="outline" onClick={onBack}>إلغاء</Button>
              </div>
            </form>
          )}

          {balanceInfo.balance <= 0 && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
              <p className="text-sm font-medium text-green-700">الحساب مسوى بالكامل. لا يوجد رصيد متبقي.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

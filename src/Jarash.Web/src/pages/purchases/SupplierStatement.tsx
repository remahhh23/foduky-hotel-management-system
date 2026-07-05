import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { supplierService, purchaseInvoiceService, supplierPaymentService, purchaseReturnService } from "./purchasesService";
import type { Supplier } from "./purchasesTypes";

export default function SupplierStatement({ onBack }: { onBack: () => void }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [transactions, setTransactions] = useState<{ date: string; description: string; debit: number; credit: number }[]>([]);
  const [balance, setBalance] = useState(0);

  const loadSuppliers = useCallback(() => {
    setSuppliers(supplierService.getAll());
  }, []);

  useEffect(() => { loadSuppliers(); }, [loadSuppliers]);

  function loadStatement(supplierId: string) {
    setSelectedId(supplierId);
    if (!supplierId) { setTransactions([]); setBalance(0); return; }
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier) return;

    const invoices = purchaseInvoiceService.getAll().filter((i) => i.supplierId === supplierId);
    const payments = supplierPaymentService.getAll().filter((p) => p.supplierId === supplierId);
    const returns = purchaseReturnService.getAll().filter((r) => r.supplierId === supplierId);

    const txns: typeof transactions = [];
    invoices.forEach((inv) => {
      txns.push({ date: inv.date, description: `فاتورة ${inv.invoiceNumber}`, debit: inv.totalAmount, credit: 0 });
    });
    returns.forEach((r) => {
      txns.push({ date: r.date, description: `مرتجع ${r.returnNumber}`, debit: 0, credit: r.totalAmount });
    });
    payments.forEach((p) => {
      const label = { payment: "دفعة", voucher: "سند صرف", settlement: "تسوية" }[p.type];
      txns.push({ date: p.date, description: `${label} - ${p.reference || ""}`, debit: 0, credit: p.amount });
    });

    txns.sort((a, b) => a.date.localeCompare(b.date));

    let bal = 0;
    txns.forEach((t) => { bal += t.debit - t.credit; });
    setTransactions(txns);
    setBalance(bal);
    logger.info("SupplierStatement: loaded", { supplierId, txCount: txns.length, balance: bal });
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">كشف حساب المورد</h3>
      </div>

      <div className="mb-6 max-w-md">
        <label className="mb-1 block text-xs font-medium text-slate-400">اختر المورد</label>
        <select
          value={selectedId}
          onChange={(e) => loadStatement(e.target.value)}
          className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500"
        >
          <option value="">اختر المورد</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {suppliers.length === 0 && <p className="mt-1 text-xs text-amber-500">لا يوجد موردون. أضف مورداً أولاً.</p>}
      </div>

      {selectedId && (
        <>
          <div className="mb-4 rounded-xl border border-white/10 bg-card-bg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">الرصيد الحالي</span>
              <span className={cn("text-lg font-bold", balance >= 0 ? "text-green-600" : "text-red-600")}>
                {balance.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-right font-medium text-slate-400">التاريخ</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-400">البيان</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-400">مدين</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-400">دائن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">لا توجد حركات</td></tr>
                )}
                {transactions.map((t, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-slate-400">{t.date}</td>
                    <td className="px-4 py-3 text-white">{t.description}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{t.debit > 0 ? t.debit.toLocaleString() : "—"}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{t.credit > 0 ? t.credit.toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

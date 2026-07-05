import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { supplierService, purchaseInvoiceService, supplierPaymentService } from "../purchases/purchasesService";

export default function SupplierAccounts({ onBack }: { onBack: () => void }) {
  const [suppliers, setSuppliers] = useState<ReturnType<typeof supplierService.getAll>>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(() => { setSuppliers(supplierService.getAll()); }, []);
  useEffect(() => { load(); }, [load]);

  function getBalance(supplierId: string) {
    const invoices = purchaseInvoiceService.getAll().filter((i) => i.supplierId === supplierId);
    const payments = supplierPaymentService.getAll().filter((p) => p.supplierId === supplierId);
    const invoicesTotal = invoices.reduce((s, i) => s + i.totalAmount, 0);
    const paidTotal = payments.reduce((s, p) => s + p.amount, 0);
    return { invoicesTotal, paidTotal, balance: invoicesTotal - paidTotal };
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">حسابات الموردين</h3>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr><th className="px-4 py-3 text-right font-medium text-slate-400">المورد</th><th className="px-4 py-3 text-right font-medium text-slate-400">الهاتف</th><th className="px-4 py-3 text-center font-medium text-slate-400">إجمالي الفواتير</th><th className="px-4 py-3 text-center font-medium text-slate-400">إجمالي المدفوعات</th><th className="px-4 py-3 text-center font-medium text-slate-400">الرصيد</th><th className="px-4 py-3 text-center font-medium text-slate-400 w-16"></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">لا يوجد موردون</td></tr>}
            {suppliers.map((s) => {
              const { invoicesTotal, paidTotal, balance } = getBalance(s.id);
              return (
                <tr key={s.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                  <td className="px-4 py-3 text-slate-500">{s.phone || "—"}</td>
                  <td className="px-4 py-3 text-center text-slate-300">{invoicesTotal.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center text-green-600">{paidTotal.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("font-bold", balance <= 0 ? "text-green-600" : "text-red-600")}>{balance.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-400 text-xs cursor-pointer" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>{expandedId === s.id ? "▲" : "▼"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

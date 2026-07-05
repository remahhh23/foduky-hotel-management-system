import { useState, useEffect } from "react";
import { cashTransactionService } from "@/pages/cash/cashService";
import type { CashTransaction } from "@/pages/cash/cashTypes";

export function ExchangeReport() {
  const [txns, setTxns] = useState<CashTransaction[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    let list = cashTransactionService.getByType("exchange");
    if (fromDate) list = list.filter((t) => t.date >= fromDate);
    if (toDate) list = list.filter((t) => t.date <= toDate);
    list.sort((a, b) => a.date.localeCompare(b.date));
    setTxns(list);
  }, [fromDate, toDate]);

  const total = txns.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-amber-400">عمليات الصرف</h2>

      <div className="mb-4 flex gap-4">
        <div>
          <label className="mb-1 block text-xs text-gray-400">من تاريخ</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
            className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-teal-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">إلى تاريخ</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
            className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-teal-500" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">التاريخ</th>
              <th className="px-3 py-2 text-right">الصندوق</th>
              <th className="px-3 py-2 text-right">البيان</th>
              <th className="px-3 py-2 text-right">الطرف</th>
              <th className="px-3 py-2 text-right">المرجع</th>
              <th className="px-3 py-2 text-left">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {txns.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-400">لا توجد عمليات صرف</td></tr>
            ) : (
              txns.map((t) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-1.5 text-sm text-gray-300">{t.date}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-400">{t.fundName}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-300">{t.description}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-400">{t.counterparty || "—"}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-400">{t.reference || "—"}</td>
                  <td className="px-3 py-1.5 text-left text-sm font-bold text-amber-400" dir="ltr">{t.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))
            )}
          </tbody>
          {txns.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-amber-500/30 font-bold">
                <td colSpan={5} className="px-3 py-2 text-sm text-amber-300">الإجمالي</td>
                <td className="px-3 py-2 text-left text-sm text-amber-300" dir="ltr">{total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

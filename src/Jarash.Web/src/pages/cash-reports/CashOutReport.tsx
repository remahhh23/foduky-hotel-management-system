import { useState, useEffect } from "react";
import { cashTransactionService } from "@/pages/cash/cashService";
import type { CashTransaction } from "@/pages/cash/cashTypes";

export function CashOutReport() {
  const [txns, setTxns] = useState<CashTransaction[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    let list = cashTransactionService.getAll().filter((t) =>
      ["payment", "exchange", "transfer_out"].includes(t.type)
    );
    if (fromDate) list = list.filter((t) => t.date >= fromDate);
    if (toDate) list = list.filter((t) => t.date <= toDate);
    list.sort((a, b) => a.date.localeCompare(b.date));
    setTxns(list);
  }, [fromDate, toDate]);

  const total = txns.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-red-400">النقد الخارج</h2>

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

      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="rounded bg-red-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">دفع</div>
          <div className="text-lg font-bold text-red-400" dir="ltr">
            {txns.filter((t) => t.type === "payment").reduce((s, t) => s + t.amount, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="rounded bg-amber-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">صرف</div>
          <div className="text-lg font-bold text-amber-400" dir="ltr">
            {txns.filter((t) => t.type === "exchange").reduce((s, t) => s + t.amount, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="rounded bg-orange-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">تحويل صادر</div>
          <div className="text-lg font-bold text-orange-400" dir="ltr">
            {txns.filter((t) => t.type === "transfer_out").reduce((s, t) => s + t.amount, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">التاريخ</th>
              <th className="px-3 py-2 text-right">النوع</th>
              <th className="px-3 py-2 text-right">الصندوق</th>
              <th className="px-3 py-2 text-right">البيان</th>
              <th className="px-3 py-2 text-right">الطرف</th>
              <th className="px-3 py-2 text-left">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {txns.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-400">لا توجد حركات نقد خارجة</td></tr>
            ) : (
              txns.map((t) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-1.5 text-sm text-gray-300">{t.date}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-400">{t.type === "payment" ? "دفع" : t.type === "exchange" ? "صرف" : "تحويل صادر"}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-400">{t.fundName}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-300">{t.description}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-400">{t.counterparty || "—"}</td>
                  <td className="px-3 py-1.5 text-left text-sm font-bold text-red-400" dir="ltr">{t.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))
            )}
          </tbody>
          {txns.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-red-500/30 font-bold">
                <td colSpan={5} className="px-3 py-2 text-sm text-red-300">الإجمالي</td>
                <td className="px-3 py-2 text-left text-sm text-red-300" dir="ltr">{total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { cashTransactionService } from "@/pages/cash/cashService";
import type { CashTransaction } from "@/pages/cash/cashTypes";

export function DailyReceipts() {
  const [txns, setTxns] = useState<CashTransaction[]>([]);

  useEffect(() => {
    setTxns(cashTransactionService.getByType("receipt"));
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, CashTransaction[]>();
    for (const t of txns) {
      const list = map.get(t.date) || [];
      list.push(t);
      map.set(t.date, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [txns]);

  const grandTotal = txns.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-green-400">المقبوضات اليومية</h2>

      <div className="mb-4 rounded border border-green-500/30 bg-green-500/10 p-3 text-center">
        <span className="text-sm text-gray-400">الإجمالي الكلي: </span>
        <span className="text-xl font-bold text-green-400" dir="ltr">
          {grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      </div>

      {grouped.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">لا توجد مقبوضات</div>
      ) : (
        grouped.map(([date, items]) => {
          const dayTotal = items.reduce((s, t) => s + t.amount, 0);
          return (
            <div key={date} className="mb-4 rounded border border-white/10">
              <div className="flex items-center justify-between bg-white/5 px-4 py-2">
                <span className="text-sm font-bold text-white">{date}</span>
                <span className="text-sm font-bold text-green-400" dir="ltr">
                  {dayTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-gray-400">
                    <th className="px-3 py-2 text-right">الصندوق</th>
                    <th className="px-3 py-2 text-right">البيان</th>
                    <th className="px-3 py-2 text-right">الطرف</th>
                    <th className="px-3 py-2 text-left">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-3 py-1.5 text-sm text-gray-400">{t.fundName}</td>
                      <td className="px-3 py-1.5 text-sm text-gray-300">{t.description}</td>
                      <td className="px-3 py-1.5 text-sm text-gray-400">{t.counterparty || "—"}</td>
                      <td className="px-3 py-1.5 text-left text-sm font-bold text-green-400" dir="ltr">{t.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
}

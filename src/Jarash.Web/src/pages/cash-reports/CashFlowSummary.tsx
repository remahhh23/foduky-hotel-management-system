import { useState, useEffect, useMemo } from "react";
import { cashTransactionService } from "@/pages/cash/cashService";
import type { CashTransaction } from "@/pages/cash/cashTypes";

export function CashFlowSummary() {
  const [txns, setTxns] = useState<CashTransaction[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    let list = cashTransactionService.getAll();
    if (fromDate) list = list.filter((t) => t.date >= fromDate);
    if (toDate) list = list.filter((t) => t.date <= toDate);
    list.sort((a, b) => a.date.localeCompare(b.date));
    setTxns(list);
  }, [fromDate, toDate]);

  const summary = useMemo(() => {
    const totalIn = txns.filter((t) => ["receipt", "receiving", "transfer_in"].includes(t.type))
      .reduce((s, t) => s + t.amount, 0);
    const totalOut = txns.filter((t) => ["payment", "exchange", "transfer_out"].includes(t.type))
      .reduce((s, t) => s + t.amount, 0);

    const byFund = new Map<string, { in: number; out: number }>();
    for (const t of txns) {
      if (!byFund.has(t.fundName)) byFund.set(t.fundName, { in: 0, out: 0 });
      const entry = byFund.get(t.fundName)!;
      if (["receipt", "receiving", "transfer_in"].includes(t.type)) entry.in += t.amount;
      else entry.out += t.amount;
    }

    return { totalIn, totalOut, net: totalIn - totalOut, byFund: Array.from(byFund.entries()) };
  }, [txns]);

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-teal-400">ملخص التدفقات النقدية</h2>

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

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded border border-green-500/30 bg-green-500/10 p-4 text-center">
          <div className="text-xs text-gray-400">إجمالي التدفقات الداخلة</div>
          <div className="text-2xl font-bold text-green-400" dir="ltr">
            {summary.totalIn.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="rounded border border-red-500/30 bg-red-500/10 p-4 text-center">
          <div className="text-xs text-gray-400">إجمالي التدفقات الخارجة</div>
          <div className="text-2xl font-bold text-red-400" dir="ltr">
            {summary.totalOut.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className={`rounded border p-4 text-center ${
          summary.net >= 0 ? "border-teal-500/30 bg-teal-500/10" : "border-red-500/30 bg-red-500/10"
        }`}>
          <div className="text-xs text-gray-400">صافي التدفق</div>
          <div className={`text-2xl font-bold ${summary.net >= 0 ? "text-teal-400" : "text-red-400"}`} dir="ltr">
            {summary.net.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <h3 className="mb-3 text-sm font-semibold text-white">ملخص حسب الصندوق</h3>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {summary.byFund.length === 0 ? (
          <div className="col-span-full text-center text-sm text-gray-400">لا توجد حركات</div>
        ) : (
          summary.byFund.map(([name, vals]) => (
            <div key={name} className="rounded border border-white/10 bg-white/5 p-3">
              <div className="mb-1 text-sm font-bold text-white">{name}</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><span className="text-gray-400">داخل: </span><span className="text-green-400" dir="ltr">{vals.in.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
                <div><span className="text-gray-400">خارج: </span><span className="text-red-400" dir="ltr">{vals.out.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
                <div><span className="text-gray-400">صافي: </span><span className={vals.in - vals.out >= 0 ? "text-teal-400" : "text-red-400"} dir="ltr">{(vals.in - vals.out).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
              </div>
            </div>
          ))
        )}
      </div>

      <h3 className="mb-2 text-sm font-semibold text-white">جميع الحركات</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">التاريخ</th>
              <th className="px-3 py-2 text-right">النوع</th>
              <th className="px-3 py-2 text-right">الصندوق</th>
              <th className="px-3 py-2 text-right">البيان</th>
              <th className="px-3 py-2 text-left">وارد</th>
              <th className="px-3 py-2 text-left">صادر</th>
            </tr>
          </thead>
          <tbody>
            {txns.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-400">لا توجد حركات</td></tr>
            ) : (
              txns.map((t) => {
                const isInflow = ["receipt", "receiving", "transfer_in"].includes(t.type);
                return (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-1.5 text-sm text-gray-300">{t.date}</td>
                    <td className="px-3 py-1.5 text-sm text-gray-400">{t.type === "receipt" ? "قبض" : t.type === "payment" ? "دفع" : t.type === "exchange" ? "صرف" : t.type === "receiving" ? "استلام" : "تحويل"}</td>
                    <td className="px-3 py-1.5 text-sm text-gray-400">{t.fundName}</td>
                    <td className="px-3 py-1.5 text-sm text-gray-300">{t.description}</td>
                    <td className="px-3 py-1.5 text-left text-sm text-green-400" dir="ltr">{isInflow ? t.amount.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}</td>
                    <td className="px-3 py-1.5 text-left text-sm text-red-400" dir="ltr">{!isInflow ? t.amount.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

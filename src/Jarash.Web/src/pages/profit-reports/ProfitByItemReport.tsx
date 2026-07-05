import { useState, useEffect, useMemo } from "react";
import { profitReportsService } from "./profitReportsService";

export function ProfitByItemReport() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const rows = useMemo(() => profitReportsService.getProfitByItem(fromDate || undefined, toDate || undefined), [fromDate, toDate]);

  const summary = useMemo(() => {
    const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
    const totalCost = rows.reduce((s, r) => s + r.cost, 0);
    const totalProfit = rows.reduce((s, r) => s + r.profit, 0);
    return { totalRevenue, totalCost, totalProfit, count: rows.length };
  }, [rows]);

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-teal-400">الأرباح حسب الصنف</h2>

      <div className="mb-4 flex flex-wrap gap-4">
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
        <div className="rounded bg-green-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">الإيرادات</div>
          <div className="text-lg font-bold text-green-400" dir="ltr">{summary.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded bg-red-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">التكاليف</div>
          <div className="text-lg font-bold text-red-400" dir="ltr">{summary.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded bg-blue-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">صافي الربح</div>
          <div className="text-lg font-bold text-blue-400" dir="ltr">{summary.totalProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">الصنف</th>
              <th className="px-3 py-2 text-left">الكمية</th>
              <th className="px-3 py-2 text-left">الإيرادات</th>
              <th className="px-3 py-2 text-left">التكلفة</th>
              <th className="px-3 py-2 text-left">الربح</th>
              <th className="px-3 py-2 text-left">الهامش</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-400">لا توجد أرباح حسب الأصناف</td></tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-1.5 text-sm text-gray-300">{r.label}</td>
                  <td className="px-3 py-1.5 text-left text-sm text-white" dir="ltr">{r.quantity ?? "—"}</td>
                  <td className="px-3 py-1.5 text-left text-sm text-green-400" dir="ltr">{r.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td className="px-3 py-1.5 text-left text-sm text-red-400" dir="ltr">{r.cost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td className={`px-3 py-1.5 text-left text-sm font-bold ${r.profit >= 0 ? "text-blue-400" : "text-red-400"}`} dir="ltr">{r.profit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td className="px-3 py-1.5 text-left text-sm text-amber-400" dir="ltr">{r.margin}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

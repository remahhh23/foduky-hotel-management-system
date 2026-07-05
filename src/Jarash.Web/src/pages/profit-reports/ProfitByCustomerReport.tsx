import { useState, useEffect, useMemo } from "react";
import { profitReportsService } from "./profitReportsService";

export function ProfitByCustomerReport() {
  const rows = useMemo(() => profitReportsService.getProfitByCustomer(), []);

  const summary = useMemo(() => {
    const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
    const totalProfit = rows.reduce((s, r) => s + r.profit, 0);
    return { totalRevenue, totalProfit, count: rows.length };
  }, [rows]);

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-teal-400">الأرباح حسب العميل</h2>

      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="rounded bg-white/5 p-3 text-center">
          <div className="text-xs text-gray-400">عدد العملاء</div>
          <div className="text-lg font-bold text-white">{summary.count}</div>
        </div>
        <div className="rounded bg-green-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">إجمالي الإيرادات</div>
          <div className="text-lg font-bold text-green-400" dir="ltr">{summary.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded bg-blue-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">إجمالي الربح</div>
          <div className="text-lg font-bold text-blue-400" dir="ltr">{summary.totalProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">العميل</th>
              <th className="px-3 py-2 text-left">الإيرادات</th>
              <th className="px-3 py-2 text-left">التكلفة التقديرية</th>
              <th className="px-3 py-2 text-left">الربح</th>
              <th className="px-3 py-2 text-left">الهامش</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-400">لا توجد بيانات عملاء. قم بإضافة فواتير للعملاء أولاً</td></tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-1.5 text-sm text-gray-300">{r.label}</td>
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

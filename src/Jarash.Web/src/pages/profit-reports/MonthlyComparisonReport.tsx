import { useState, useEffect, useMemo } from "react";
import { profitReportsService } from "./profitReportsService";

export function MonthlyComparisonReport() {
  const months = useMemo(() => profitReportsService.getMonthlyComparison(), []);

  const summary = useMemo(() => {
    const totalRevenue = months.reduce((s, m) => s + m.revenue, 0);
    const totalCost = months.reduce((s, m) => s + m.cost, 0);
    const totalProfit = months.reduce((s, m) => s + m.profit, 0);
    const avgMargin = months.filter((m) => m.revenue > 0).reduce((s, m, _, arr) => s + m.margin / arr.length, 0);
    return { totalRevenue, totalCost, totalProfit, avgMargin: Math.round(avgMargin * 100) / 100 };
  }, [months]);

  const maxProfit = Math.max(...months.map((m) => Math.abs(m.profit)), 1);

  const bestMonth = months.reduce((best, m) => m.profit > (best?.profit ?? -Infinity) ? m : best, months[0]);
  const worstMonth = months.reduce((worst, m) => m.profit < (worst?.profit ?? Infinity) ? m : worst, months[0]);

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-teal-400">مقارنة الأرباح الشهرية</h2>

      <div className="mb-4 grid grid-cols-4 gap-4">
        <div className="rounded bg-green-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">إجمالي الإيرادات</div>
          <div className="text-lg font-bold text-green-400" dir="ltr">{summary.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded bg-red-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">إجمالي التكاليف</div>
          <div className="text-lg font-bold text-red-400" dir="ltr">{summary.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded bg-blue-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">صافي الربح</div>
          <div className="text-lg font-bold text-blue-400" dir="ltr">{summary.totalProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded bg-amber-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">متوسط الهامش</div>
          <div className="text-lg font-bold text-amber-400" dir="ltr">{summary.avgMargin}%</div>
        </div>
      </div>

      {bestMonth && worstMonth && (
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="rounded border border-green-500/30 bg-green-500/10 p-3">
            <span className="text-xs text-gray-400">أفضل شهر: </span>
            <span className="text-sm font-bold text-green-400">{bestMonth.month}</span>
            <span className="mr-2 text-sm text-green-400" dir="ltr">({bestMonth.profit.toLocaleString("en-US", { minimumFractionDigits: 2 })})</span>
          </div>
          <div className="rounded border border-red-500/30 bg-red-500/10 p-3">
            <span className="text-xs text-gray-400">أسوأ شهر: </span>
            <span className="text-sm font-bold text-red-400">{worstMonth.month}</span>
            <span className="mr-2 text-sm text-red-400" dir="ltr">({worstMonth.profit.toLocaleString("en-US", { minimumFractionDigits: 2 })})</span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">الشهر</th>
              <th className="px-3 py-2 text-left">الإيرادات</th>
              <th className="px-3 py-2 text-left">التكاليف</th>
              <th className="px-3 py-2 text-left">الربح</th>
              <th className="px-3 py-2 text-left">الهامش</th>
              <th className="px-3 py-2 text-left">المخطط</th>
            </tr>
          </thead>
          <tbody>
            {months.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-400">لا توجد بيانات شهرية</td></tr>
            ) : (
              months.map((m, idx) => {
                const barColor = m.profit >= 0 ? "bg-green-500" : "bg-red-500";
                const barWidth = Math.min(Math.abs(m.profit) / maxProfit * 100, 100);
                return (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-1.5 text-sm font-bold text-white">{m.month}</td>
                    <td className="px-3 py-1.5 text-left text-sm text-green-400" dir="ltr">{m.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-1.5 text-left text-sm text-red-400" dir="ltr">{m.cost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className={`px-3 py-1.5 text-left text-sm font-bold ${m.profit >= 0 ? "text-blue-400" : "text-red-400"}`} dir="ltr">{m.profit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-1.5 text-left text-sm text-amber-400" dir="ltr">{m.margin}%</td>
                    <td className="px-3 py-1.5 text-left">
                      <div className="h-2 w-full rounded-full bg-white/10">
                        <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${barWidth}%` }} />
                      </div>
                    </td>
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

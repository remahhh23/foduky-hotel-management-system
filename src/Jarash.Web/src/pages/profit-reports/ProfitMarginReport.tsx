import { useState, useEffect, useMemo } from "react";
import { profitReportsService } from "./profitReportsService";

export function ProfitMarginReport() {
  const [sortBy, setSortBy] = useState<"margin" | "name">("margin");

  const data = useMemo(() => profitReportsService.getProfitMargin(), []);

  const sorted = useMemo(() => {
    const list = [...data.rows];
    if (sortBy === "margin") return list.sort((a, b) => b.margin - a.margin);
    return list.sort((a, b) => a.label.localeCompare(b.label));
  }, [data, sortBy]);

  const highMargin = data.rows.filter((r) => r.margin >= 50);
  const lowMargin = data.rows.filter((r) => r.margin > 0 && r.margin < 20);
  const negative = data.rows.filter((r) => r.margin <= 0);

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-amber-400">هامش الربح</h2>

      <div className="mb-4 grid grid-cols-4 gap-4">
        <div className="rounded bg-white/5 p-3 text-center">
          <div className="text-xs text-gray-400">متوسط الهامش</div>
          <div className="text-lg font-bold text-white" dir="ltr">{data.overallMargin}%</div>
        </div>
        <div className="rounded bg-green-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">هامش مرتفع (50%+)</div>
          <div className="text-lg font-bold text-green-400">{highMargin.length}</div>
        </div>
        <div className="rounded bg-amber-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">هامش منخفض (أقل 20%)</div>
          <div className="text-lg font-bold text-amber-400">{lowMargin.length}</div>
        </div>
        <div className="rounded bg-red-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">بخسارة</div>
          <div className="text-lg font-bold text-red-400">{negative.length}</div>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <button onClick={() => setSortBy("margin")}
          className={`rounded px-3 py-1 text-xs ${sortBy === "margin" ? "bg-teal-600 text-white" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}>ترتيب حسب الهامش</button>
        <button onClick={() => setSortBy("name")}
          className={`rounded px-3 py-1 text-xs ${sortBy === "name" ? "bg-teal-600 text-white" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}>ترتيب حسب الاسم</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">الصنف</th>
              <th className="px-3 py-2 text-left">سعر البيع</th>
              <th className="px-3 py-2 text-left">التكلفة</th>
              <th className="px-3 py-2 text-left">الربح</th>
              <th className="px-3 py-2 text-left">هامش الربح</th>
              <th className="px-3 py-2 text-left">المؤشر</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-400">لا توجد أصناف</td></tr>
            ) : (
              sorted.map((r, idx) => {
                const barColor = r.margin >= 50 ? "bg-green-500" : r.margin >= 20 ? "bg-amber-500" : r.margin > 0 ? "bg-orange-500" : "bg-red-500";
                return (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-1.5 text-sm text-gray-300">{r.label}</td>
                    <td className="px-3 py-1.5 text-left text-sm text-green-400" dir="ltr">{r.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-1.5 text-left text-sm text-red-400" dir="ltr">{r.cost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-1.5 text-left text-sm font-bold text-blue-400" dir="ltr">{r.profit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className={`px-3 py-1.5 text-left text-sm font-bold ${r.margin >= 50 ? "text-green-400" : r.margin >= 20 ? "text-amber-400" : r.margin > 0 ? "text-orange-400" : "text-red-400"}`} dir="ltr">{r.margin}%</td>
                    <td className="px-3 py-1.5 text-left">
                      <div className="h-2 w-full rounded-full bg-white/10">
                        <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${Math.min(Math.max(r.margin, 0), 100)}%` }} />
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

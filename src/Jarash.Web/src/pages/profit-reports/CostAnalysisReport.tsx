import { useState, useEffect, useMemo } from "react";
import { profitReportsService } from "./profitReportsService";

export function CostAnalysisReport() {
  const data = useMemo(() => profitReportsService.getCostAnalysis(), []);

  const totalCost = data.reduce((s, c) => s + c.amount, 0);
  const totalItems = data.reduce((s, c) => s + c.itemCount, 0);
  const maxAmount = data.length > 0 ? data[0].amount : 1;

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-rose-400">تحليل تكلفة المبيعات</h2>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="rounded bg-white/5 p-3 text-center">
          <div className="text-xs text-gray-400">إجمالي التكلفة</div>
          <div className="text-lg font-bold text-rose-400" dir="ltr">{totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded bg-white/5 p-3 text-center">
          <div className="text-xs text-gray-400">عدد التصنيفات</div>
          <div className="text-lg font-bold text-white">{data.length}</div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">لا توجد بيانات تكلفة</div>
      ) : (
        <div className="space-y-3">
          {data.map((c, idx) => (
            <div key={idx} className="rounded border border-white/10 bg-white/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-white">{c.category}</span>
                  <span className="mr-2 text-xs text-gray-400">({c.itemCount} أصناف)</span>
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold text-rose-400" dir="ltr">{c.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  <span className="mr-2 text-xs text-gray-400">({c.percentage}%)</span>
                </div>
              </div>
              <div className="h-3 w-full rounded-full bg-white/10">
                <div className="h-3 rounded-full bg-rose-500" style={{ width: `${(c.amount / maxAmount) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">التصنيف</th>
              <th className="px-3 py-2 text-left">عدد الأصناف</th>
              <th className="px-3 py-2 text-left">التكلفة</th>
              <th className="px-3 py-2 text-left">النسبة</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c, idx) => (
              <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-3 py-1.5 text-sm text-gray-300">{c.category}</td>
                <td className="px-3 py-1.5 text-left text-sm text-white" dir="ltr">{c.itemCount}</td>
                <td className="px-3 py-1.5 text-left text-sm font-bold text-rose-400" dir="ltr">{c.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                <td className="px-3 py-1.5 text-left text-sm text-amber-400" dir="ltr">{c.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

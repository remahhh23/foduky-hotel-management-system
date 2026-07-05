import { useState, useEffect, useMemo } from "react";
import { profitReportsService } from "./profitReportsService";

export function ProfitBySupplierReport() {
  const rows = useMemo(() => profitReportsService.getProfitBySupplier(), []);

  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const maxCost = rows.length > 0 ? rows[0].cost : 1;

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-rose-400">الأرباح حسب المورد</h2>
      <p className="mb-4 text-sm text-gray-400">إجمالي المشتريات من كل مورد</p>

      <div className="mb-4 rounded bg-white/5 p-3 text-center">
        <span className="text-sm text-gray-400">إجمالي المشتريات: </span>
        <span className="text-xl font-bold text-rose-400" dir="ltr">{totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">المورد</th>
              <th className="px-3 py-2 text-left">إجمالي المشتريات</th>
              <th className="px-3 py-2 text-left">المؤشر</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-400">لا توجد مشتريات من موردين</td></tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-1.5 text-sm text-gray-300">{r.label}</td>
                  <td className="px-3 py-1.5 text-left text-sm font-bold text-rose-400" dir="ltr">{r.cost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td className="px-3 py-1.5 text-left">
                    <div className="h-2 w-full rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-rose-500" style={{ width: `${(r.cost / maxCost) * 100}%` }} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

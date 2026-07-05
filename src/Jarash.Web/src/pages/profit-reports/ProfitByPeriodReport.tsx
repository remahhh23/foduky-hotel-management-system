import { useState, useEffect, useMemo } from "react";
import { profitReportsService } from "./profitReportsService";

export function ProfitByPeriodReport() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const summary = useMemo(() => profitReportsService.getSummary(fromDate || undefined, toDate || undefined), [fromDate, toDate]);

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-teal-400">الأرباح حسب الفترة</h2>

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

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="rounded bg-white/5 p-3">
          <div className="mb-2 text-sm font-bold text-white">مؤشرات الأداء</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-white/5 pb-1">
              <span className="text-sm text-gray-400">عدد الأصناف</span>
              <span className="text-sm font-bold text-white" dir="ltr">{summary.itemCount}</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-1">
              <span className="text-sm text-gray-400">عدد الحركات</span>
              <span className="text-sm font-bold text-white" dir="ltr">{summary.transactionCount}</span>
            </div>
          </div>
        </div>
        <div className="rounded bg-white/5 p-3">
          <div className="mb-2 text-sm font-bold text-white">الملخص المالي</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-white/5 pb-1">
              <span className="text-sm text-gray-400">إجمالي الإيرادات</span>
              <span className="text-sm font-bold text-green-400" dir="ltr">{summary.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-1">
              <span className="text-sm text-gray-400">إجمالي التكاليف</span>
              <span className="text-sm font-bold text-red-400" dir="ltr">{summary.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-1">
              <span className="text-sm text-gray-400">إجمالي الربح</span>
              <span className={`text-sm font-bold ${summary.grossProfit >= 0 ? "text-blue-400" : "text-red-400"}`} dir="ltr">{summary.grossProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">هامش الربح</span>
              <span className={`text-sm font-bold ${summary.profitMargin >= 20 ? "text-green-400" : summary.profitMargin >= 0 ? "text-amber-400" : "text-red-400"}`} dir="ltr">{summary.profitMargin}%</span>
            </div>
          </div>
        </div>
      </div>

      {summary.totalRevenue === 0 && summary.totalCost === 0 && (
        <div className="rounded border border-amber-500/30 bg-amber-500/10 p-4 text-center">
          <p className="text-sm text-amber-400">لا توجد إيرادات أو تكاليف مسجلة في هذه الفترة</p>
          <p className="mt-1 text-xs text-gray-400">البيانات المعروضة تستند إلى المخزون والمشتريات والفواتير المسجلة في النظام</p>
        </div>
      )}
    </div>
  );
}

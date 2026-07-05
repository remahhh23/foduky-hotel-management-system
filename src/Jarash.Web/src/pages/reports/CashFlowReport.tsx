import { useState, useEffect } from "react";
import { reportsService } from "./reportsService";
import type { CashFlowRow } from "./reportsTypes";

export function CashFlowReport() {
  const [rows, setRows] = useState<CashFlowRow[]>([]);
  const [totalInflow, setTotalInflow] = useState(0);
  const [totalOutflow, setTotalOutflow] = useState(0);
  const [netCashFlow, setNetCashFlow] = useState(0);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const data = reportsService.getCashFlow(fromDate || undefined, toDate || undefined);
    setRows(data.rows);
    setTotalInflow(data.totalInflow);
    setTotalOutflow(data.totalOutflow);
    setNetCashFlow(data.netCashFlow);
  }, [fromDate, toDate]);

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-teal-400">التدفقات النقدية</h2>

      <div className="mb-4 flex gap-4">
        <div>
          <label className="mb-1 block text-xs text-gray-400">من تاريخ</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-teal-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">إلى تاريخ</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-teal-500"
          />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="rounded border border-green-500/30 bg-green-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">إجمالي الوارد</div>
          <div className="text-lg font-bold text-green-400" dir="ltr">
            {totalInflow.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">إجمالي الصادر</div>
          <div className="text-lg font-bold text-red-400" dir="ltr">
            {totalOutflow.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className={`rounded border p-3 text-center ${
          netCashFlow >= 0
            ? "border-teal-500/30 bg-teal-500/10"
            : "border-red-500/30 bg-red-500/10"
        }`}>
          <div className="text-xs text-gray-400">صافي التدفق</div>
          <div className={`text-lg font-bold ${netCashFlow >= 0 ? "text-teal-400" : "text-red-400"}`} dir="ltr">
            {netCashFlow.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">التاريخ</th>
              <th className="px-3 py-2 text-right">البيان</th>
              <th className="px-3 py-2 text-right">الصندوق</th>
              <th className="px-3 py-2 text-left">وارد</th>
              <th className="px-3 py-2 text-left">صادر</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-400">لا توجد حركات نقدية</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-1.5 text-sm text-gray-300">{r.date}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-300">{r.description}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-400">{r.fundName}</td>
                  <td className="px-3 py-1.5 text-left text-sm text-green-400" dir="ltr">
                    {r.inflow > 0 ? r.inflow.toLocaleString("en-US", { minimumFractionDigits: 2 }) : ""}
                  </td>
                  <td className="px-3 py-1.5 text-left text-sm text-red-400" dir="ltr">
                    {r.outflow > 0 ? r.outflow.toLocaleString("en-US", { minimumFractionDigits: 2 }) : ""}
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

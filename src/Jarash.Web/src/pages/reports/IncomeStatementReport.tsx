import { useState, useEffect } from "react";
import { reportsService } from "./reportsService";
import type { IncomeStatementData } from "./reportsTypes";

export function IncomeStatementReport() {
  const [data, setData] = useState<IncomeStatementData | null>(null);

  useEffect(() => {
    setData(reportsService.getIncomeStatement());
  }, []);

  if (!data) return <div className="text-gray-400">جاري التحميل...</div>;

  const renderRows = (rows: { accountName: string; balance: number; level: number }[]) =>
    rows.map((r, i) => (
      <tr key={i} className="border-b border-white/5">
        <td className="px-3 py-1 text-sm text-gray-300" style={{ paddingRight: `${12 + r.level * 16}px` }}>
          {r.accountName}
        </td>
        <td className="px-3 py-1 text-left text-sm text-white/80" dir="ltr">
          {r.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </td>
      </tr>
    ));

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-teal-400">قائمة الدخل</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded bg-white/5 p-3">
          <h3 className="mb-2 text-sm font-semibold text-emerald-400">الإيرادات</h3>
          <table className="w-full">
            <tbody>{renderRows(data.revenues)}</tbody>
            <tfoot>
              <tr className="border-t border-emerald-500/30 font-bold">
                <td className="px-3 py-1 text-sm text-emerald-300">إجمالي الإيرادات</td>
                <td className="px-3 py-1 text-left text-sm text-emerald-300" dir="ltr">
                  {data.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="rounded bg-white/5 p-3">
          <h3 className="mb-2 text-sm font-semibold text-amber-400">المصروفات</h3>
          <table className="w-full">
            <tbody>{renderRows(data.expenses)}</tbody>
            <tfoot>
              <tr className="border-t border-amber-500/30 font-bold">
                <td className="px-3 py-1 text-sm text-amber-300">إجمالي المصروفات</td>
                <td className="px-3 py-1 text-left text-sm text-amber-300" dir="ltr">
                  {data.totalExpense.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className={`mt-4 rounded border p-3 text-center ${
        data.netIncome >= 0
          ? "border-green-500/30 bg-green-500/10"
          : "border-red-500/30 bg-red-500/10"
      }`}>
        <span className={`text-sm font-bold ${
          data.netIncome >= 0 ? "text-green-300" : "text-red-300"
        }`}>
          {data.netIncome >= 0 ? "صافي الربح" : "صافي الخسارة"}:{" "}
          {Math.abs(data.netIncome).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}

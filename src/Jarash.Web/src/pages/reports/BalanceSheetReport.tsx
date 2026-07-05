import { useState, useEffect } from "react";
import { reportsService } from "./reportsService";
import type { BalanceSheetData } from "./reportsTypes";

export function BalanceSheetReport() {
  const [data, setData] = useState<BalanceSheetData | null>(null);

  useEffect(() => {
    setData(reportsService.getBalanceSheet());
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
      <h2 className="mb-4 text-lg font-bold text-teal-400">الميزانية العمومية</h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded bg-white/5 p-3">
          <h3 className="mb-2 text-sm font-semibold text-blue-400">الأصول</h3>
          <table className="w-full">
            <tbody>{renderRows(data.assets)}</tbody>
            <tfoot>
              <tr className="border-t border-blue-500/30 font-bold">
                <td className="px-3 py-1 text-sm text-blue-300">إجمالي الأصول</td>
                <td className="px-3 py-1 text-left text-sm text-blue-300" dir="ltr">
                  {data.totalAssets.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="rounded bg-white/5 p-3">
          <h3 className="mb-2 text-sm font-semibold text-red-400">الخصوم</h3>
          <table className="w-full">
            <tbody>{renderRows(data.liabilities)}</tbody>
            <tfoot>
              <tr className="border-t border-red-500/30 font-bold">
                <td className="px-3 py-1 text-sm text-red-300">إجمالي الخصوم</td>
                <td className="px-3 py-1 text-left text-sm text-red-300" dir="ltr">
                  {data.totalLiabilities.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="rounded bg-white/5 p-3">
          <h3 className="mb-2 text-sm font-semibold text-green-400">حقوق الملكية</h3>
          <table className="w-full">
            <tbody>{renderRows(data.equity)}</tbody>
            <tfoot>
              <tr className="border-t border-green-500/30 font-bold">
                <td className="px-3 py-1 text-sm text-green-300">إجمالي حقوق الملكية</td>
                <td className="px-3 py-1 text-left text-sm text-green-300" dir="ltr">
                  {data.totalEquity.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="mt-4 rounded border border-teal-500/30 bg-teal-500/10 p-3 text-center">
        <span className="text-sm text-teal-300">
          معادلة الميزانية: الأصول ({data.totalAssets.toLocaleString("en-US", { minimumFractionDigits: 2 })}) = الخصوم (
          {data.totalLiabilities.toLocaleString("en-US", { minimumFractionDigits: 2 })}) + حقوق الملكية (
          {data.totalEquity.toLocaleString("en-US", { minimumFractionDigits: 2 })}) —{" "}
          {Math.abs(data.totalAssets - data.totalLiabilities - data.totalEquity) < 0.01
            ? "✔ متوازنة"
            : "✘ غير متوازنة"}
        </span>
      </div>
    </div>
  );
}

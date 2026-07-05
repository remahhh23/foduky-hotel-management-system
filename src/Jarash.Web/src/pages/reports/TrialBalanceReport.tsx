import { useState, useEffect } from "react";
import { reportsService } from "./reportsService";
import type { TrialBalanceData } from "./reportsTypes";
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_COLORS } from "@/pages/accounts/accountsTypes";

export function TrialBalanceReport() {
  const [data, setData] = useState<TrialBalanceData | null>(null);

  useEffect(() => {
    setData(reportsService.getTrialBalance());
  }, []);

  if (!data) return <div className="text-gray-400">جاري التحميل...</div>;

  const isBalanced = Math.abs(data.totalDebit - data.totalCredit) < 0.01;

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-teal-400">ميزان المراجعة</h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">الكود</th>
              <th className="px-3 py-2 text-right">الحساب</th>
              <th className="px-3 py-2 text-right">النوع</th>
              <th className="px-3 py-2 text-left">مدين</th>
              <th className="px-3 py-2 text-left">دائن</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.accountId} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-3 py-1.5 text-sm text-gray-400">{r.accountCode}</td>
                <td className="px-3 py-1.5 text-sm text-gray-300">{r.accountName}</td>
                <td className="px-3 py-1.5">
                  <span className={`rounded px-1.5 py-0.5 text-xs ${ACCOUNT_TYPE_COLORS[r.accountType as keyof typeof ACCOUNT_TYPE_COLORS] || ""}`}>
                    {ACCOUNT_TYPE_LABELS[r.accountType as keyof typeof ACCOUNT_TYPE_LABELS] || r.accountType}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-left text-sm text-white/80" dir="ltr">
                  {r.debit > 0 ? r.debit.toLocaleString("en-US", { minimumFractionDigits: 2 }) : ""}
                </td>
                <td className="px-3 py-1.5 text-left text-sm text-white/80" dir="ltr">
                  {r.credit > 0 ? r.credit.toLocaleString("en-US", { minimumFractionDigits: 2 }) : ""}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-teal-500/30 font-bold">
              <td colSpan={3} className="px-3 py-2 text-sm text-teal-300">الإجمالي</td>
              <td className="px-3 py-2 text-left text-sm text-teal-300" dir="ltr">
                {data.totalDebit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
              <td className="px-3 py-2 text-left text-sm text-teal-300" dir="ltr">
                {data.totalCredit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className={`mt-4 rounded border p-2 text-center text-sm ${
        isBalanced ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-red-500/30 bg-red-500/10 text-red-300"
      }`}>
        {isBalanced ? "✔ الميزان متوازن — مجموع الأرصدة المدينة يساوي مجموع الأرصدة الدائنة" : "✘ الميزان غير متوازن"}
      </div>
    </div>
  );
}

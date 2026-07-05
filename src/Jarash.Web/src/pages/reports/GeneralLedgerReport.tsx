import { useState, useEffect } from "react";
import { reportsService } from "./reportsService";
import type { GeneralLedgerData } from "./reportsTypes";
import { accountService } from "@/pages/accounts/accountsService";

export function GeneralLedgerReport() {
  const accounts = accountService.getAll();
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || "");
  const [data, setData] = useState<GeneralLedgerData | null>(null);

  useEffect(() => {
    if (selectedAccountId) {
      setData(reportsService.getGeneralLedger(selectedAccountId));
    }
  }, [selectedAccountId]);

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-teal-400">دفتر الأستاذ</h2>

      <div className="mb-4">
        <label className="mb-1 block text-sm text-gray-400">اختر الحساب</label>
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="w-full max-w-xs rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
          ))}
        </select>
      </div>

      {data && data.accountName ? (
        <>
          <div className="mb-3 flex items-center gap-4 text-sm text-gray-400">
            <span>الحساب: <span className="text-white">{data.accountName}</span></span>
            <span>الكود: <span className="text-white">{data.accountCode}</span></span>
            <span>الرصيد الختامي: <span className="text-teal-300" dir="ltr">{data.closingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-xs text-gray-400">
                  <th className="px-3 py-2 text-right">التاريخ</th>
                  <th className="px-3 py-2 text-right">البيان</th>
                  <th className="px-3 py-2 text-right">رقم القيد</th>
                  <th className="px-3 py-2 text-left">مدين</th>
                  <th className="px-3 py-2 text-left">دائن</th>
                  <th className="px-3 py-2 text-left">الرصيد</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-400">لا توجد حركات</td></tr>
                ) : (
                  data.rows.map((r, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-3 py-1.5 text-sm text-gray-300">{r.date}</td>
                      <td className="px-3 py-1.5 text-sm text-gray-300">{r.memo}</td>
                      <td className="px-3 py-1.5 text-sm text-gray-400">{r.entryNumber}</td>
                      <td className="px-3 py-1.5 text-left text-sm text-white/80" dir="ltr">
                        {r.debit > 0 ? r.debit.toLocaleString("en-US", { minimumFractionDigits: 2 }) : ""}
                      </td>
                      <td className="px-3 py-1.5 text-left text-sm text-white/80" dir="ltr">
                        {r.credit > 0 ? r.credit.toLocaleString("en-US", { minimumFractionDigits: 2 }) : ""}
                      </td>
                      <td className="px-3 py-1.5 text-left text-sm text-white/80" dir="ltr">
                        {r.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-teal-500/30 font-bold">
                  <td colSpan={3} className="px-3 py-2 text-sm text-teal-300">الإجمالي</td>
                  <td className="px-3 py-2 text-left text-sm text-teal-300" dir="ltr">
                    {data.totalDebit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2 text-left text-sm text-teal-300" dir="ltr">
                    {data.totalCredit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2 text-left text-sm text-teal-300" dir="ltr">
                    {data.closingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      ) : (
        <div className="text-sm text-gray-400">الرجاء اختيار حساب</div>
      )}
    </div>
  );
}

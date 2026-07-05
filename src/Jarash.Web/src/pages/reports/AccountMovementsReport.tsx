import { useState, useEffect } from "react";
import { reportsService } from "./reportsService";
import type { AccountMovementRow } from "./reportsTypes";
import { accountService } from "@/pages/accounts/accountsService";

export function AccountMovementsReport() {
  const accounts = accountService.getAll();
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || "");
  const [rows, setRows] = useState<AccountMovementRow[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (selectedAccountId) {
      setRows(reportsService.getAccountMovements(selectedAccountId, fromDate || undefined, toDate || undefined));
    }
  }, [selectedAccountId, fromDate, toDate]);

  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const closingBalance = rows.length > 0 ? rows[rows.length - 1].balance : 0;

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-teal-400">حركة الحسابات</h2>

      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-xs text-gray-400">الحساب</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-teal-500"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
            ))}
          </select>
        </div>
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

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">التاريخ</th>
              <th className="px-3 py-2 text-right">المرجع</th>
              <th className="px-3 py-2 text-right">البيان</th>
              <th className="px-3 py-2 text-left">مدين</th>
              <th className="px-3 py-2 text-left">دائن</th>
              <th className="px-3 py-2 text-left">الرصيد</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-400">لا توجد حركات</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-1.5 text-sm text-gray-300">{r.date}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-400">{r.reference}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-300">{r.description}</td>
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
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-teal-500/30 font-bold">
                <td colSpan={3} className="px-3 py-2 text-sm text-teal-300">الإجمالي</td>
                <td className="px-3 py-2 text-left text-sm text-teal-300" dir="ltr">
                  {totalDebit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2 text-left text-sm text-teal-300" dir="ltr">
                  {totalCredit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2 text-left text-sm text-teal-300" dir="ltr">
                  {closingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

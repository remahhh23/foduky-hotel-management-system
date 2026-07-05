import { useState, useEffect } from "react";
import { reportsService } from "./reportsService";
import type { GeneralJournalRow } from "./reportsTypes";

export function GeneralJournalReport() {
  const [rows, setRows] = useState<GeneralJournalRow[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    setRows(reportsService.getGeneralJournal(fromDate || undefined, toDate || undefined));
  }, [fromDate, toDate]);

  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-teal-400">اليومية العامة</h2>

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

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">التاريخ</th>
              <th className="px-3 py-2 text-right">رقم القيد</th>
              <th className="px-3 py-2 text-right">البيان</th>
              <th className="px-3 py-2 text-right">الحساب</th>
              <th className="px-3 py-2 text-right">الوصف</th>
              <th className="px-3 py-2 text-left">مدين</th>
              <th className="px-3 py-2 text-left">دائن</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-sm text-gray-400">لا توجد قيود في هذه الفترة</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-1.5 text-sm text-gray-300">{r.date}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-400">{r.entryNumber}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-300">{r.memo}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-300">{r.accountName}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-400">{r.description}</td>
                  <td className="px-3 py-1.5 text-left text-sm text-white/80" dir="ltr">
                    {r.debit > 0 ? r.debit.toLocaleString("en-US", { minimumFractionDigits: 2 }) : ""}
                  </td>
                  <td className="px-3 py-1.5 text-left text-sm text-white/80" dir="ltr">
                    {r.credit > 0 ? r.credit.toLocaleString("en-US", { minimumFractionDigits: 2 }) : ""}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-teal-500/30 font-bold">
                <td colSpan={5} className="px-3 py-2 text-sm text-teal-300">الإجمالي</td>
                <td className="px-3 py-2 text-left text-sm text-teal-300" dir="ltr">
                  {totalDebit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2 text-left text-sm text-teal-300" dir="ltr">
                  {totalCredit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="mt-2 text-sm text-gray-400">
        إجمالي عدد القيود: {rows.length > 0 ? new Set(rows.map((r) => r.entryNumber)).size : 0}
      </div>
    </div>
  );
}

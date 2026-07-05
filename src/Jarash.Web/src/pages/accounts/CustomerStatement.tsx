import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { customerService, journalEntryService } from "./accountsService";
import type { Customer } from "./accountsTypes";

export default function CustomerStatement({ onBack }: { onBack: () => void }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [transactions, setTransactions] = useState<{ date: string; description: string; debit: number; credit: number }[]>([]);
  const [balance, setBalance] = useState(0);

  const load = useCallback(() => { setCustomers(customerService.getAll()); }, []);
  useEffect(() => { load(); }, [load]);

  function loadStatement(customerId: string) {
    setSelectedId(customerId);
    if (!customerId) { setTransactions([]); setBalance(0); return; }
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    const entries = journalEntryService.getAll().filter((e) => e.status === "posted");
    const txns: typeof transactions = [];
    entries.forEach((entry) => {
      entry.lines.filter((l) => l.accountName.toLowerCase().includes(cust.name.toLowerCase())).forEach((l) => {
        txns.push({ date: entry.date, description: `${entry.entryNumber} - ${l.description}`, debit: l.debit, credit: l.credit });
      });
    });
    txns.sort((a, b) => a.date.localeCompare(b.date));
    let bal = 0;
    txns.forEach((t) => { bal += t.debit - t.credit; });
    setTransactions(txns);
    setBalance(bal);
    logger.info("CustomerStatement: loaded", { customerId, txCount: txns.length, balance: bal });
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">كشف حساب عميل</h3>
      </div>

      <div className="mb-6 max-w-md">
        <label className="mb-1 block text-xs font-medium text-slate-400">اختر العميل</label>
        <select value={selectedId} onChange={(e) => loadStatement(e.target.value)}
          className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500">
          <option value="">اختر العميل</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {selectedId && (
        <>
          <div className="mb-4 rounded-xl border border-white/10 bg-card-bg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">الرصيد الحالي</span>
              <span className={cn("text-lg font-bold", balance >= 0 ? "text-green-600" : "text-red-600")}>{balance.toLocaleString()}</span>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr><th className="px-4 py-3 text-right font-medium text-slate-400">التاريخ</th><th className="px-4 py-3 text-right font-medium text-slate-400">البيان</th><th className="px-4 py-3 text-center font-medium text-slate-400">مدين</th><th className="px-4 py-3 text-center font-medium text-slate-400">دائن</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">لا توجد حركات</td></tr>}
                {transactions.map((t, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-slate-400">{t.date}</td>
                    <td className="px-4 py-3 text-white">{t.description}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{t.debit > 0 ? t.debit.toLocaleString() : "—"}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{t.credit > 0 ? t.credit.toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

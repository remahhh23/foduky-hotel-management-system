import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { cashFundService, cashTransactionService } from "./cashService";
import { TRANSACTION_TYPE_LABELS } from "./cashTypes";
import type { CashFund, CashTransaction } from "./cashTypes";

export default function FundStatement({ onBack }: { onBack: () => void }) {
  const [openFunds, setOpenFunds] = useState<CashFund[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadFunds = useCallback(() => {
    setOpenFunds(cashFundService.getAll());
  }, []);

  useEffect(() => { loadFunds(); }, [loadFunds]);

  function loadStatement(fundId: string) {
    setSelectedId(fundId);
    if (!fundId) { setTransactions([]); return; }
    let txns = cashTransactionService.getByFund(fundId);
    if (dateFrom) txns = txns.filter((t) => t.date >= dateFrom);
    if (dateTo) txns = txns.filter((t) => t.date <= dateTo);
    txns.sort((a, b) => a.date.localeCompare(b.date));
    setTransactions(txns);
    logger.info("FundStatement: loaded", { fundId, count: txns.length });
  }

  const fund = openFunds.find((f) => f.id === selectedId);
  let runningBalance = fund?.initialBalance ?? 0;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">كشف حركة الصندوق</h3>
      </div>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">الصندوق</label>
          <select value={selectedId} onChange={(e) => loadStatement(e.target.value)}
            className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500">
            <option value="">اختر الصندوق</option>
            {openFunds.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.status === "open" ? "مفتوح" : "مغلق"})</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">من تاريخ</label>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); if (selectedId) loadStatement(selectedId); }}
            className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">إلى تاريخ</label>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); if (selectedId) loadStatement(selectedId); }}
            className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
        </div>
      </div>

      {selectedId && fund && (
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 bg-card-bg p-3 shadow-sm">
            <div className="text-xs text-slate-500">الرصيد الافتتاحي</div>
            <div className="text-lg font-bold text-white">{fund.initialBalance.toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-card-bg p-3 shadow-sm">
            <div className="text-xs text-slate-500">إجمالي الوارد</div>
            <div className="text-lg font-bold text-green-600">
              {transactions.filter((t) => t.type === "receipt" || t.type === "receiving" || t.type === "transfer_in")
                .reduce((s, t) => s + t.amount, 0).toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-card-bg p-3 shadow-sm">
            <div className="text-xs text-slate-500">إجمالي المنصرف</div>
            <div className="text-lg font-bold text-red-600">
              {transactions.filter((t) => t.type === "payment" || t.type === "exchange" || t.type === "transfer_out")
                .reduce((s, t) => s + t.amount, 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {selectedId && (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-slate-400">التاريخ</th>
                <th className="px-4 py-3 text-right font-medium text-slate-400">النوع</th>
                <th className="px-4 py-3 text-right font-medium text-slate-400">البيان</th>
                <th className="px-4 py-3 text-right font-medium text-slate-400">الطرف</th>
                <th className="px-4 py-3 text-center font-medium text-slate-400">وارد</th>
                <th className="px-4 py-3 text-center font-medium text-slate-400">منصرف</th>
                <th className="px-4 py-3 text-center font-medium text-slate-400">الرصيد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">لا توجد حركات</td></tr>
              )}
              {transactions.map((t) => {
                const isInflow = t.type === "receipt" || t.type === "receiving" || t.type === "transfer_in";
                runningBalance += isInflow ? t.amount : -t.amount;
                return (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-slate-400">{t.date}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-400">{TRANSACTION_TYPE_LABELS[t.type]}</span>
                    </td>
                    <td className="px-4 py-3 text-white">{t.description}</td>
                    <td className="px-4 py-3 text-slate-500">{t.counterparty || "—"}</td>
                    <td className="px-4 py-3 text-center text-green-600 font-medium">
                      {isInflow ? t.amount.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-red-600 font-medium">
                      {!isInflow ? t.amount.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-white">{runningBalance.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

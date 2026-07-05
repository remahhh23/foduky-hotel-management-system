import { useState, useEffect } from "react";
import { cashFundService, cashTransactionService } from "@/pages/cash/cashService";
import { TRANSACTION_TYPE_LABELS } from "@/pages/cash/cashTypes";
import type { CashFund, CashTransaction } from "@/pages/cash/cashTypes";

export function TreasuryMovements() {
  const [funds, setFunds] = useState<CashFund[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [txns, setTxns] = useState<CashTransaction[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    setFunds(cashFundService.getAll());
  }, []);

  useEffect(() => {
    if (!selectedId) { setTxns([]); return; }
    let list = cashTransactionService.getByFund(selectedId);
    if (fromDate) list = list.filter((t) => t.date >= fromDate);
    if (toDate) list = list.filter((t) => t.date <= toDate);
    list.sort((a, b) => a.date.localeCompare(b.date));
    setTxns(list);
  }, [selectedId, fromDate, toDate]);

  const fund = funds.find((f) => f.id === selectedId);
  let runningBalance = fund?.initialBalance ?? 0;
  const totalIn = txns.filter((t) => ["receipt", "receiving", "transfer_in"].includes(t.type)).reduce((s, t) => s + t.amount, 0);
  const totalOut = txns.filter((t) => ["payment", "exchange", "transfer_out"].includes(t.type)).reduce((s, t) => s + t.amount, 0);
  const closingBalance = fund ? fund.initialBalance + totalIn - totalOut : 0;

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-teal-400">حركة الخزينة</h2>

      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-xs text-gray-400">الخزينة</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
            className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-teal-500">
            <option value="">اختر الخزينة</option>
            {funds.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
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

      {selectedId && fund && (
        <>
          <div className="mb-4 grid grid-cols-4 gap-4">
            <div className="rounded bg-white/5 p-3 text-center">
              <div className="text-xs text-gray-400">الرصيد الافتتاحي</div>
              <div className="text-lg font-bold text-white" dir="ltr">{fund.initialBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="rounded bg-green-500/10 p-3 text-center">
              <div className="text-xs text-gray-400">إجمالي الوارد</div>
              <div className="text-lg font-bold text-green-400" dir="ltr">{totalIn.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="rounded bg-red-500/10 p-3 text-center">
              <div className="text-xs text-gray-400">إجمالي المنصرف</div>
              <div className="text-lg font-bold text-red-400" dir="ltr">{totalOut.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="rounded border border-teal-500/30 bg-teal-500/10 p-3 text-center">
              <div className="text-xs text-gray-400">الرصيد الختامي</div>
              <div className="text-lg font-bold text-teal-400" dir="ltr">{closingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-xs text-gray-400">
                  <th className="px-3 py-2 text-right">التاريخ</th>
                  <th className="px-3 py-2 text-right">النوع</th>
                  <th className="px-3 py-2 text-right">البيان</th>
                  <th className="px-3 py-2 text-right">الطرف</th>
                  <th className="px-3 py-2 text-left">وارد</th>
                  <th className="px-3 py-2 text-left">منصرف</th>
                  <th className="px-3 py-2 text-left">الرصيد</th>
                </tr>
              </thead>
              <tbody>
                {txns.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-4 text-center text-sm text-gray-400">لا توجد حركات</td></tr>
                ) : (
                  txns.map((t) => {
                    const isInflow = ["receipt", "receiving", "transfer_in"].includes(t.type);
                    runningBalance += isInflow ? t.amount : -t.amount;
                    return (
                      <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-3 py-1.5 text-sm text-gray-300">{t.date}</td>
                        <td className="px-3 py-1.5 text-sm text-gray-400">{TRANSACTION_TYPE_LABELS[t.type]}</td>
                        <td className="px-3 py-1.5 text-sm text-gray-300">{t.description}</td>
                        <td className="px-3 py-1.5 text-sm text-gray-400">{t.counterparty || "—"}</td>
                        <td className="px-3 py-1.5 text-left text-sm text-green-400" dir="ltr">{isInflow ? t.amount.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}</td>
                        <td className="px-3 py-1.5 text-left text-sm text-red-400" dir="ltr">{!isInflow ? t.amount.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}</td>
                        <td className="px-3 py-1.5 text-left text-sm font-bold text-white" dir="ltr">{Math.round(runningBalance * 100) / 100}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { cashFundService, cashTransactionService } from "@/pages/cash/cashService";
import { TRANSACTION_TYPE_LABELS } from "@/pages/cash/cashTypes";
import type { CashFund, CashTransaction } from "@/pages/cash/cashTypes";

export function DailyClosingReport() {
  const [funds, setFunds] = useState<CashFund[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [txns, setTxns] = useState<CashTransaction[]>([]);

  useEffect(() => {
    setFunds(cashFundService.getAll());
  }, []);

  useEffect(() => {
    let list = cashTransactionService.getAll();
    list = list.filter((t) => t.date === selectedDate);
    list.sort((a, b) => a.fundName.localeCompare(b.fundName));
    setTxns(list);
  }, [selectedDate]);

  const totalReceipt = txns.filter((t) => t.type === "receipt").reduce((s, t) => s + t.amount, 0);
  const totalPayment = txns.filter((t) => t.type === "payment").reduce((s, t) => s + t.amount, 0);
  const totalExchange = txns.filter((t) => t.type === "exchange").reduce((s, t) => s + t.amount, 0);
  const totalReceiving = txns.filter((t) => t.type === "receiving").reduce((s, t) => s + t.amount, 0);
  const totalTransferIn = txns.filter((t) => t.type === "transfer_in").reduce((s, t) => s + t.amount, 0);
  const totalTransferOut = txns.filter((t) => t.type === "transfer_out").reduce((s, t) => s + t.amount, 0);
  const totalIn = totalReceipt + totalReceiving + totalTransferIn;
  const totalOut = totalPayment + totalExchange + totalTransferOut;

  const fundSummary = funds.map((f) => {
    const fundTxns = txns.filter((t) => t.fundId === f.id);
    const fundIn = fundTxns.filter((t) => ["receipt", "receiving", "transfer_in"].includes(t.type)).reduce((s, t) => s + t.amount, 0);
    const fundOut = fundTxns.filter((t) => ["payment", "exchange", "transfer_out"].includes(t.type)).reduce((s, t) => s + t.amount, 0);
    return { ...f, dayIn: fundIn, dayOut: fundOut, dayNet: fundIn - fundOut };
  });

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-teal-400">تقرير الإغلاق اليومي</h2>

      <div className="mb-4">
        <label className="mb-1 block text-xs text-gray-400">التاريخ</label>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-teal-500" />
      </div>

      <div className="mb-4 grid grid-cols-4 gap-4">
        <div className="rounded bg-green-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">قبض</div>
          <div className="text-lg font-bold text-green-400" dir="ltr">{totalReceipt.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded bg-red-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">دفع</div>
          <div className="text-lg font-bold text-red-400" dir="ltr">{totalPayment.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded bg-amber-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">صرف</div>
          <div className="text-lg font-bold text-amber-400" dir="ltr">{totalExchange.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded bg-blue-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">استلام</div>
          <div className="text-lg font-bold text-blue-400" dir="ltr">{totalReceiving.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="rounded border border-green-500/30 bg-green-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">إجمالي الوارد اليومي</div>
          <div className="text-lg font-bold text-green-400" dir="ltr">{totalIn.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">إجمالي المنصرف اليومي</div>
          <div className="text-lg font-bold text-red-400" dir="ltr">{totalOut.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className={`rounded border p-3 text-center ${
          totalIn - totalOut >= 0 ? "border-teal-500/30 bg-teal-500/10" : "border-red-500/30 bg-red-500/10"
        }`}>
          <div className="text-xs text-gray-400">صافي اليوم</div>
          <div className={`text-lg font-bold ${totalIn - totalOut >= 0 ? "text-teal-400" : "text-red-400"}`} dir="ltr">
            {(totalIn - totalOut).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <h3 className="mb-2 text-sm font-semibold text-white">ملخص الصناديق</h3>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fundSummary.map((f) => (
          <div key={f.id} className="rounded border border-white/10 bg-white/5 p-3">
            <div className="text-sm font-bold text-white">{f.name}</div>
            <div className="mt-1 grid grid-cols-3 gap-2 text-xs">
              <div><span className="text-gray-400">وارد: </span><span className="text-green-400" dir="ltr">{f.dayIn.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
              <div><span className="text-gray-400">منصرف: </span><span className="text-red-400" dir="ltr">{f.dayOut.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
              <div><span className="text-gray-400">الرصيد: </span><span className="text-white" dir="ltr">{f.currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
            </div>
          </div>
        ))}
      </div>

      <h3 className="mb-2 text-sm font-semibold text-white">تفاصيل العمليات</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">الوقت</th>
              <th className="px-3 py-2 text-right">النوع</th>
              <th className="px-3 py-2 text-right">الصندوق</th>
              <th className="px-3 py-2 text-right">البيان</th>
              <th className="px-3 py-2 text-right">الطرف</th>
              <th className="px-3 py-2 text-left">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {txns.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-400">لا توجد عمليات في هذا التاريخ</td></tr>
            ) : (
              txns.map((t) => {
                const isInflow = ["receipt", "receiving", "transfer_in"].includes(t.type);
                return (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-1.5 text-sm text-gray-300">{t.createdAt?.split("T")[1]?.slice(0, 8) || t.date}</td>
                    <td className="px-3 py-1.5 text-sm">{TRANSACTION_TYPE_LABELS[t.type]}</td>
                    <td className="px-3 py-1.5 text-sm text-gray-400">{t.fundName}</td>
                    <td className="px-3 py-1.5 text-sm text-gray-300">{t.description}</td>
                    <td className="px-3 py-1.5 text-sm text-gray-400">{t.counterparty || "—"}</td>
                    <td className={`px-3 py-1.5 text-left text-sm font-bold ${isInflow ? "text-green-400" : "text-red-400"}`} dir="ltr">
                      {t.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

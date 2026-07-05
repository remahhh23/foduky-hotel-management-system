import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { cashFundService, cashTransactionService } from "./cashService";
import { createJournalFromCashTransaction } from "@/lib/integration";
import type { CashFund } from "./cashTypes";

export default function FundTransfer({ onBack }: { onBack: () => void }) {
  const [openFunds, setOpenFunds] = useState<CashFund[]>([]);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const load = useCallback(() => {
    setOpenFunds(cashFundService.getOpen());
  }, []);

  useEffect(() => { load(); }, [load]);

  const fromFund = openFunds.find((f) => f.id === fromId);
  const toFund = openFunds.find((f) => f.id === toId);

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!fromId) errs.fromId = "صندوق المصدر مطلوب";
    if (!toId) errs.toId = "صندوق الهدف مطلوب";
    if (fromId === toId) errs.toId = "لا يمكن التحويل لنفس الصندوق";
    if (amount <= 0) errs.amount = "المبلغ يجب أن يكون أكبر من صفر";
    if (fromFund && amount > fromFund.currentBalance) errs.amount = "الرصيد غير كافٍ";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      const date = new Date().toISOString().split("T")[0];
      const txnOut = cashTransactionService.create({
        fundId: fromId, fundName: fromFund?.name ?? "", type: "transfer_out",
        amount, description: `تحويل إلى ${toFund?.name} - ${description}`, reference: "",
        counterparty: toFund?.name ?? "", notes: "", date,
      });
      const txnIn = cashTransactionService.create({
        fundId: toId, fundName: toFund?.name ?? "", type: "transfer_in",
        amount, description: `تحويل من ${fromFund?.name} - ${description}`, reference: "",
        counterparty: fromFund?.name ?? "", notes: "", date,
      });
      try {
        createJournalFromCashTransaction(txnOut);
        createJournalFromCashTransaction(txnIn);
      } catch (journalErr) {
        logger.error("FundTransfer: journal entry failed, rolling back", journalErr);
        cashTransactionService.delete(txnOut.id);
        cashTransactionService.delete(txnIn.id);
        throw journalErr;
      }
      logger.info("FundTransfer: transferred", { from: fromId, to: toId, amount });
      setFromId(""); setToId(""); setAmount(0); setDescription("");
    } catch (err) {
      logger.error("FundTransfer: failed", err);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">تحويل بين الصناديق</h3>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl rounded-xl border border-white/10 bg-card-bg p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">من صندوق</label>
            <select value={fromId} onChange={(e) => setFromId(e.target.value)}
              className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.fromId ? "border-red-400" : "border-white/20")}>
              <option value="">اختر</option>
              {openFunds.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.currentBalance.toLocaleString()})</option>)}
            </select>
            {errors.fromId && <p className="mt-1 text-xs text-red-500">{errors.fromId}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">إلى صندوق</label>
            <select value={toId} onChange={(e) => setToId(e.target.value)}
              className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.toId ? "border-red-400" : "border-white/20")}>
              <option value="">اختر</option>
              {openFunds.filter((f) => f.id !== fromId).map((f) => <option key={f.id} value={f.id}>{f.name} ({f.currentBalance.toLocaleString()})</option>)}
            </select>
            {errors.toId && <p className="mt-1 text-xs text-red-500">{errors.toId}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">المبلغ</label>
            <input type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))}
              className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.amount ? "border-red-400" : "border-white/20")} />
            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">ملاحظات</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
          </div>
        </div>
        {fromFund && toFund && amount > 0 && (
          <div className="mt-4 rounded-lg bg-sky-50 px-4 py-3 text-sm">
            <div className="flex justify-between text-slate-400"><span>{fromFund.name}</span><span className="text-red-600">-{amount.toLocaleString()}</span></div>
            <div className="flex justify-between text-slate-400 mt-1"><span>{toFund.name}</span><span className="text-green-600">+{amount.toLocaleString()}</span></div>
            <div className="border-t border-white/10 mt-2 pt-2 flex justify-between font-bold">
              <span>الرصيد بعد التحويل</span>
              <span>{fromFund.currentBalance - amount} / {toFund.currentBalance + amount}</span>
            </div>
          </div>
        )}
        <div className="mt-6 flex gap-2">
          <Button type="submit">تنفيذ التحويل</Button>
          <Button type="button" variant="outline" onClick={onBack}>إلغاء</Button>
        </div>
      </form>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { cashFundService, cashTransactionService } from "./cashService";
import { FUND_STATUS_LABELS, FUND_STATUS_COLORS } from "./cashTypes";

export default function FundBalances({ onBack }: { onBack: () => void }) {
  const [funds, setFunds] = useState(cashFundService.getAll());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(() => {
    setFunds(cashFundService.getAll());
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalBalance = funds.reduce((sum, f) => sum + f.currentBalance, 0);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">أرصدة الصناديق</h3>
      </div>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {funds.map((f) => (
          <div key={f.id} className={cn("rounded-xl border p-4 shadow-sm", f.status === "open" ? "border-green-200 bg-green-50" : "border-white/10 bg-card-bg")}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white">{f.name}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", FUND_STATUS_COLORS[f.status])}>
                {FUND_STATUS_LABELS[f.status]}
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{f.currentBalance.toLocaleString()}</div>
            <div className="mt-1 text-xs text-slate-500">الرصيد الافتتاحي: {f.initialBalance.toLocaleString()}</div>
          </div>
        ))}
        {funds.length === 0 && (
          <div className="col-span-full rounded-xl border border-white/10 p-8 text-center text-sm text-slate-400">
            لا توجد صناديق. قم بفتح صندوق أولاً.
          </div>
        )}
      </div>

      {funds.length > 0 && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-sky-800">الإجمالي العام</span>
            <span className="text-2xl font-bold text-sky-700">{totalBalance.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

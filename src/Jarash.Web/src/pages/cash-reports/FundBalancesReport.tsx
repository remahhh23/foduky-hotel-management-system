import { useState, useEffect } from "react";
import { cashFundService } from "@/pages/cash/cashService";
import { FUND_STATUS_LABELS, FUND_STATUS_COLORS } from "@/pages/cash/cashTypes";

export function FundBalancesReport() {
  const [funds, setFunds] = useState(cashFundService.getAll());

  useEffect(() => {
    setFunds(cashFundService.getAll());
  }, []);

  const totalBalance = funds.reduce((sum, f) => sum + f.currentBalance, 0);
  const openCount = funds.filter((f) => f.status === "open").length;

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-teal-400">أرصدة الصناديق</h2>

      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="rounded border border-teal-500/30 bg-teal-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">إجمالي الأرصدة</div>
          <div className="text-xl font-bold text-teal-400" dir="ltr">{totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded bg-white/5 p-3 text-center">
          <div className="text-xs text-gray-400">عدد الصناديق المفتوحة</div>
          <div className="text-xl font-bold text-white">{openCount}</div>
        </div>
        <div className="rounded bg-white/5 p-3 text-center">
          <div className="text-xs text-gray-400">إجمالي الصناديق</div>
          <div className="text-xl font-bold text-white">{funds.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {funds.length === 0 ? (
          <div className="col-span-full rounded border border-white/10 p-8 text-center text-sm text-gray-400">لا توجد صناديق</div>
        ) : (
          funds.map((f) => (
            <div key={f.id} className={`rounded border p-4 ${
              f.status === "open" ? "border-green-500/30 bg-green-500/5" : "border-white/10 bg-white/5"
            }`}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold text-white">{f.name}</span>
                <span className={`rounded px-2 py-0.5 text-xs ${FUND_STATUS_COLORS[f.status]}`}>
                  {FUND_STATUS_LABELS[f.status]}
                </span>
              </div>
              <div className="text-2xl font-bold text-white" dir="ltr">
                {f.currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>افتتاحي: {f.initialBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                <span>{f.status === "open" ? "مفتوح من: " + f.openedAt?.split("T")[0] : "مغلق: " + f.closedAt?.split("T")[0]}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

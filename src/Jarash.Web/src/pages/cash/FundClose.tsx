import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { usePermission } from "@/lib/permissions";
import { cashFundService, cashTransactionService } from "./cashService";
import { createJournalFromCashTransaction } from "@/lib/integration";
import type { CashFund } from "./cashTypes";

export default function FundClose({ onBack }: { onBack: () => void }) {
  const { can } = usePermission();
  const [openFunds, setOpenFunds] = useState<CashFund[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [cashCount, setCashCount] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const load = useCallback(() => {
    setOpenFunds(cashFundService.getOpen());
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!can("إدارة النقد")) {
    return (
      <div>
        <div className="mb-4 flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
          <h3 className="text-lg font-bold text-slate-800">إغلاق الصندوق</h3>
        </div>
        <p className="text-sm text-red-500">ليس لديك صلاحية الوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  const selectedFund = openFunds.find((f) => f.id === selectedId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) { setErrors({ selectedId: "اختر الصندوق" }); return; }
    const fund = cashFundService.getById(selectedId);
    if (!fund) return;
    if (cashCount !== fund.currentBalance && !confirm("المبلغ المدخل لا يساوي رصيد الصندوق. هل تريد الإغلاق مع فارق؟")) return;
    if (cashCount !== fund.currentBalance) {
      const diff = cashCount - fund.currentBalance;
      const txn = cashTransactionService.create({
        fundId: fund.id,
        fundName: fund.name,
        type: diff > 0 ? "receipt" : "payment",
        amount: Math.abs(diff),
        description: `فارق إغلاق الصندوق - ${diff > 0 ? "زيادة" : "نقص"}`,
        reference: `CLOSE-${fund.id.slice(-8)}`,
        counterparty: "إدارة",
        notes: `المبلغ النقدي: ${cashCount}, الرصيد الدفترى: ${fund.currentBalance}`,
        date: new Date().toISOString().split("T")[0],
      });
      createJournalFromCashTransaction(txn);
    }
    cashFundService.close(selectedId);
    logger.info("FundClose: closed", { id: selectedId, cashCount });
    onBack();
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-slate-800">إغلاق الصندوق</h3>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">الصندوق المفتوح</label>
            <select value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setCashCount(0); setErrors({}); }}
              className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.selectedId ? "border-red-400" : "border-slate-300")}>
              <option value="">اختر الصندوق</option>
              {openFunds.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            {errors.selectedId && <p className="mt-1 text-xs text-red-500">{errors.selectedId}</p>}
            {openFunds.length === 0 && <p className="mt-1 text-xs text-amber-500">لا توجد صناديق مفتوحة</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">الرصيد الحالي</label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {selectedFund ? selectedFund.currentBalance.toLocaleString() : "—"}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">المبلغ النقدي الفعلي</label>
            <input type="number" min={0} value={cashCount} onChange={(e) => setCashCount(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500" />
          </div>
        </div>
        {selectedFund && cashCount > 0 && cashCount !== selectedFund.currentBalance && (
          <p className="mt-3 text-xs text-amber-600">
            الفرق: {(selectedFund.currentBalance - cashCount).toLocaleString()}
          </p>
        )}
        <div className="mt-6 flex gap-2">
          <Button type="submit">إغلاق الصندوق</Button>
          <Button type="button" variant="outline" onClick={onBack}>إلغاء</Button>
        </div>
      </form>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { journalEntryService, accountService } from "./accountsService";
import type { Account, JournalEntryLine } from "./accountsTypes";

export default function NewJournalEntry({ onBack }: { onBack: () => void }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState<JournalEntryLine[]>([{ id: "1", accountId: "", accountName: "", description: "", debit: 0, credit: 0 }]);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const load = useCallback(() => { setAccounts(accountService.getAll()); }, []);
  useEffect(() => { load(); }, [load]);

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  function addLine() {
    setLines((prev) => [...prev, { id: String(prev.length + 1), accountId: "", accountName: "", description: "", debit: 0, credit: 0 }]);
  }

  function removeLine(idx: number) {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateLine(idx: number, field: keyof JournalEntryLine, value: string | number) {
    setLines((prev) => prev.map((line, i) => {
      if (i !== idx) return line;
      const updated = { ...line, [field]: value };
      if (field === "accountId") {
        const acc = accounts.find((a) => a.id === value);
        updated.accountName = acc ? `${acc.code} - ${acc.name}` : "";
      }
      return updated;
    }));
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!memo.trim()) errs.memo = "البيان مطلوب";
    if (lines.some((l) => !l.accountId)) errs.lines = "جميع الحسابات مطلوبة";
    if (lines.some((l) => l.debit === 0 && l.credit === 0)) errs.lines = "كل سطر يجب أن يكون له قيمة";
    if (!isBalanced) errs.balance = "القيد غير متوازن (المجموع يجب أن يتساوى)";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      journalEntryService.create({ date, memo: memo.trim(), lines, status: "draft" });
      logger.info("NewJournalEntry: created");
      onBack();
    } catch (err) { logger.error("NewJournalEntry: failed", err); }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">قيد يومية</h3>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl rounded-xl border border-white/10 bg-card-bg p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div><label className="mb-1 block text-xs font-medium text-slate-400">التاريخ</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
          <div><label className="mb-1 block text-xs font-medium text-slate-400">البيان</label>
            <input value={memo} onChange={(e) => setMemo(e.target.value)}
              className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.memo ? "border-red-400" : "border-white/20")} />
            {errors.memo && <p className="mt-1 text-xs text-red-500">{errors.memo}</p>}</div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-400">تفاصيل القيد</label>
            <Button type="button" size="sm" variant="outline" onClick={addLine}><Plus className="h-4 w-4 ml-1" /> إضافة سطر</Button>
          </div>
          {errors.lines && <p className="mb-2 text-xs text-red-500">{errors.lines}</p>}
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr><th className="px-3 py-2 text-right font-medium text-slate-400">الحساب</th><th className="px-3 py-2 text-right font-medium text-slate-400">البيان</th><th className="px-3 py-2 text-center font-medium text-slate-400 w-28">مدين</th><th className="px-3 py-2 text-center font-medium text-slate-400 w-28">دائن</th><th className="w-10"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((line, idx) => (
                  <tr key={line.id}>
                    <td className="px-3 py-2">
                      <select value={line.accountId} onChange={(e) => updateLine(idx, "accountId", e.target.value)}
                        className="w-full rounded border border-white/20 px-2 py-1.5 text-xs outline-none focus:border-sky-500">
                        <option value="">اختر الحساب</option>
                        {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input value={line.description} onChange={(e) => updateLine(idx, "description", e.target.value)}
                        className="w-full rounded border border-white/20 px-2 py-1.5 text-xs outline-none focus:border-sky-500" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min={0} value={line.debit || ""} onChange={(e) => updateLine(idx, "debit", Number(e.target.value))}
                        className="w-full rounded border border-white/20 px-2 py-1.5 text-xs outline-none focus:border-sky-500 text-center" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min={0} value={line.credit || ""} onChange={(e) => updateLine(idx, "credit", Number(e.target.value))}
                        className="w-full rounded border border-white/20 px-2 py-1.5 text-xs outline-none focus:border-sky-500 text-center" />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button type="button" onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600 disabled:opacity-30" disabled={lines.length <= 1}><X className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className={cn("flex-1 rounded-lg px-4 py-3 flex items-center justify-between", isBalanced ? "bg-green-50" : "bg-red-50")}>
            <span className="text-sm font-medium text-slate-400">مجموع المدين</span>
            <span className={cn("text-lg font-bold", isBalanced ? "text-green-700" : "text-red-700")}>{totalDebit.toLocaleString()}</span>
          </div>
          <div className={cn("flex-1 rounded-lg px-4 py-3 flex items-center justify-between", isBalanced ? "bg-green-50" : "bg-red-50")}>
            <span className="text-sm font-medium text-slate-400">مجموع الدائن</span>
            <span className={cn("text-lg font-bold", isBalanced ? "text-green-700" : "text-red-700")}>{totalCredit.toLocaleString()}</span>
          </div>
        </div>
        {errors.balance && <p className="-mt-4 mb-4 text-xs text-red-500">{errors.balance}</p>}

        <div className="flex gap-2">
          <Button type="submit">حفظ كمسودة</Button>
          <Button type="button" variant="outline" onClick={onBack}>إلغاء</Button>
        </div>
      </form>
    </div>
  );
}

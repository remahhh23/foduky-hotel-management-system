import { useState, useEffect, useCallback } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { journalEntryService, accountService } from "./accountsService";
import { JOURNAL_ENTRY_STATUS_LABELS, JOURNAL_ENTRY_STATUS_COLORS } from "./accountsTypes";
import type { JournalEntry, JournalEntryLine, Account } from "./accountsTypes";

export default function EditJournalEntry({ onBack }: { onBack: () => void }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ date: "", memo: "" });
  const [lines, setLines] = useState<JournalEntryLine[]>([]);

  const load = useCallback(() => {
    setAccounts(accountService.getAll());
    setEntries(journalEntryService.getAll().filter((e) => e.status === "draft"));
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(e: JournalEntry) {
    setEditId(e.id);
    setForm({ date: e.date, memo: e.memo });
    setLines(e.lines.map((l) => ({ ...l })));
  }

  function cancelEdit() { setEditId(null); setLines([]); setForm({ date: "", memo: "" }); }

  function addLine() { setLines((prev) => [...prev, { id: String(prev.length + 1), accountId: "", accountName: "", description: "", debit: 0, credit: 0 }]); }

  function removeLine(idx: number) { if (lines.length > 1) setLines((prev) => prev.filter((_, i) => i !== idx)); }

  function updateLine(idx: number, field: keyof JournalEntryLine, value: string | number) {
    setLines((prev) => prev.map((line, i) => {
      if (i !== idx) return line;
      const updated = { ...line, [field]: value };
      if (field === "accountId") { const acc = accounts.find((a) => a.id === value); updated.accountName = acc ? `${acc.code} - ${acc.name}` : ""; }
      return updated;
    }));
  }

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  function handleSave() {
    if (!editId) return;
    if (lines.some((l) => !l.accountId)) { alert("جميع الحسابات مطلوبة"); return; }
    if (!isBalanced) { alert("القيد غير متوازن"); return; }
    journalEntryService.update(editId, { date: form.date, memo: form.memo, lines });
    logger.info("EditJournalEntry: updated", { id: editId });
    cancelEdit();
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">تعديل قيد</h3>
      </div>

      {editId && (
        <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
          <h4 className="text-sm font-bold text-sky-800 mb-3">تعديل القيد</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div><label className="mb-1 block text-xs font-medium text-slate-400">التاريخ</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
            <div><label className="mb-1 block text-xs font-medium text-slate-400">البيان</label>
              <input value={form.memo} onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
          </div>
          <div className="mb-3">
            <Button type="button" size="sm" variant="outline" onClick={addLine} className="mb-2"><Plus className="h-4 w-4 ml-1" /> سطر</Button>
            <div className="rounded-lg border border-sky-100 bg-card-bg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-sky-50"><tr><th className="px-2 py-1.5 text-right text-xs font-medium text-slate-400">الحساب</th><th className="px-2 py-1.5 text-right text-xs font-medium text-slate-400">البيان</th><th className="px-2 py-1.5 text-center text-xs font-medium text-slate-400 w-24">مدين</th><th className="px-2 py-1.5 text-center text-xs font-medium text-slate-400 w-24">دائن</th><th className="w-8"></th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((line, idx) => (
                    <tr key={line.id}>
                      <td className="px-2 py-1"><select value={line.accountId} onChange={(e) => updateLine(idx, "accountId", e.target.value)}
                        className="w-full rounded border border-white/20 px-2 py-1 text-xs outline-none focus:border-sky-500">
                        <option value="">اختر</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}</select></td>
                      <td className="px-2 py-1"><input value={line.description} onChange={(e) => updateLine(idx, "description", e.target.value)}
                        className="w-full rounded border border-white/20 px-2 py-1 text-xs outline-none focus:border-sky-500" /></td>
                      <td className="px-2 py-1"><input type="number" min={0} value={line.debit || ""} onChange={(e) => updateLine(idx, "debit", Number(e.target.value))}
                        className="w-full rounded border border-white/20 px-2 py-1 text-xs outline-none focus:border-sky-500 text-center" /></td>
                      <td className="px-2 py-1"><input type="number" min={0} value={line.credit || ""} onChange={(e) => updateLine(idx, "credit", Number(e.target.value))}
                        className="w-full rounded border border-white/20 px-2 py-1 text-xs outline-none focus:border-sky-500 text-center" /></td>
                      <td className="px-2 py-1 text-center"><button type="button" onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600" disabled={lines.length <= 1}><X className="h-3.5 w-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className={cn("flex-1 rounded px-3 py-2 text-sm flex justify-between", isBalanced ? "bg-green-50" : "bg-red-50")}>
              <span>مدين</span><span className={cn("font-bold", isBalanced ? "text-green-700" : "text-red-700")}>{totalDebit.toLocaleString()}</span>
            </div>
            <div className={cn("flex-1 rounded px-3 py-2 text-sm flex justify-between", isBalanced ? "bg-green-50" : "bg-red-50")}>
              <span>دائن</span><span className={cn("font-bold", isBalanced ? "text-green-700" : "text-red-700")}>{totalCredit.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex gap-2"><Button size="sm" onClick={handleSave}>حفظ</Button><Button size="sm" variant="outline" onClick={cancelEdit}>إلغاء</Button></div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr><th className="px-4 py-3 text-right font-medium text-slate-400">رقم القيد</th><th className="px-4 py-3 text-center font-medium text-slate-400">التاريخ</th><th className="px-4 py-3 text-right font-medium text-slate-400">البيان</th><th className="px-4 py-3 text-center font-medium text-slate-400">مدين</th><th className="px-4 py-3 text-center font-medium text-slate-400">دائن</th><th className="px-4 py-3 text-center font-medium text-slate-400">الحالة</th><th className="px-4 py-3 text-center font-medium text-slate-400 w-16"></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">لا توجد قيود مسودة</td></tr>}
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{e.entryNumber}</td>
                <td className="px-4 py-3 text-center text-slate-400">{e.date}</td>
                <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">{e.memo}</td>
                <td className="px-4 py-3 text-center text-slate-300">{e.totalDebit.toLocaleString()}</td>
                <td className="px-4 py-3 text-center text-slate-300">{e.totalCredit.toLocaleString()}</td>
                <td className="px-4 py-3 text-center"><span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", JOURNAL_ENTRY_STATUS_COLORS[e.status])}>{JOURNAL_ENTRY_STATUS_LABELS[e.status]}</span></td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => startEdit(e)} className="rounded p-1.5 text-slate-400 hover:bg-sky-50 hover:text-sky-600"><Plus className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

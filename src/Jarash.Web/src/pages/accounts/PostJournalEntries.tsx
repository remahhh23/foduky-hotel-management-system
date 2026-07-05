import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { journalEntryService } from "./accountsService";
import { JOURNAL_ENTRY_STATUS_LABELS, JOURNAL_ENTRY_STATUS_COLORS } from "./accountsTypes";
import type { JournalEntry } from "./accountsTypes";

export default function PostJournalEntries({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  const load = useCallback(() => {
    setEntries(journalEntryService.getAll().filter((e) => e.status === "draft"));
  }, []);

  useEffect(() => { load(); }, [load]);

  function handlePost(id: string) {
    if (!confirm("تأكيد ترحيل هذا القيد؟ لا يمكن التراجع عن الترحيل.")) return;
    const success = journalEntryService.post(id);
    if (success) {
      logger.info("PostJournalEntries: posted", { id });
      load();
    } else {
      alert("فشل الترحيل. تأكد من أن القيد متوازن وغير مرحل مسبقاً.");
    }
  }

  function handleDelete(id: string) {
    if (!confirm("تأكيد حذف هذا القيد المسودة؟")) return;
    journalEntryService.delete(id);
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">ترحيل القيود</h3>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-slate-400">رقم القيد</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">التاريخ</th>
              <th className="px-4 py-3 text-right font-medium text-slate-400">البيان</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">عدد الأسطر</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">المبلغ</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">الحالة</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400 w-32"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">لا توجد قيود مسودة للترحيل</td></tr>
            )}
            {entries.map((e) => {
              const balanced = e.totalDebit === e.totalCredit;
              return (
                <tr key={e.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{e.entryNumber}</td>
                  <td className="px-4 py-3 text-center text-slate-400">{e.date}</td>
                  <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">{e.memo}</td>
                  <td className="px-4 py-3 text-center text-slate-400">{e.lines.length}</td>
                  <td className="px-4 py-3 text-center text-slate-300 font-medium">{e.totalDebit.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", JOURNAL_ENTRY_STATUS_COLORS[e.status])}>
                      {JOURNAL_ENTRY_STATUS_LABELS[e.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1">
                      <Button size="sm" onClick={() => handlePost(e.id)} disabled={!balanced}>
                        <CheckCircle className="h-4 w-4 ml-1" /> ترحيل
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(e.id)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {entries.length > 0 && (
        <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-700">
          <p>ملاحظة: لا يمكن ترحيل قيد غير متوازن (مجموع المدين ≠ مجموع الدائن). عدل القيد من قسم "تعديل قيد" أولاً.</p>
        </div>
      )}
    </div>
  );
}

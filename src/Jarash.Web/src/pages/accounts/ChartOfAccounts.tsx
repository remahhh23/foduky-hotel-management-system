import { useState, useEffect, useCallback } from "react";
import { Plus, Edit3, Trash2, ChevronDown, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { accountService } from "./accountsService";
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_COLORS } from "./accountsTypes";
import type { Account, AccountType } from "./accountsTypes";

const emptyForm = { code: "", name: "", parentId: "" as string | null, type: "asset" as AccountType, notes: "" };

export default function ChartOfAccounts({ onBack, treeMode }: { onBack: () => void; treeMode?: boolean }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const load = useCallback(() => { setAccounts(accountService.getAll()); }, []);
  useEffect(() => { load(); }, [load]);

  const rootAccounts = accounts.filter((a) => a.parentId === null);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  function getChildren(parentId: string): Account[] { return accounts.filter((a) => a.parentId === parentId).sort((a, b) => a.code.localeCompare(b.code)); }

  function renderTree(accs: Account[], level: number = 0) {
    return accs.sort((a, b) => a.code.localeCompare(b.code)).map((a) => {
      const children = getChildren(a.id);
      const expanded = expandedIds.has(a.id);
      return (
        <div key={a.id}>
          <div className={cn("flex items-center gap-2 py-2 px-2 hover:bg-white/5 rounded-lg transition-colors", level > 0 && "mr-6")} style={{ marginRight: level * 24 }}>
            <button onClick={() => toggleExpand(a.id)} className="text-slate-400 hover:text-slate-400 w-4">
              {children.length > 0 ? (expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />) : <span className="inline-block w-4" />}
            </button>
            <span className="text-xs font-mono text-slate-400 w-14">{a.code}</span>
            <span className="flex-1 text-sm font-medium text-white">{a.name}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", ACCOUNT_TYPE_COLORS[a.type])}>{ACCOUNT_TYPE_LABELS[a.type]}</span>
            <div className="flex gap-1">
              <button onClick={() => { setEditId(a.id); setForm({ code: a.code, name: a.name, parentId: a.parentId, type: a.type, notes: a.notes }); setShowForm(true); setErrors({}); }}
                className="rounded p-1 text-slate-400 hover:bg-sky-50 hover:text-sky-600" title="تعديل"><Edit3 className="h-3.5 w-3.5" /></button>
              <button onClick={() => { if (confirm("تأكيد حذف هذا الحساب؟")) { if (!accountService.delete(a.id)) alert("لا يمكن حذف حساب له أبناء"); load(); } }}
                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500" title="حذف"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
          {expanded && children.length > 0 && renderTree(children, level + 1)}
        </div>
      );
    });
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.code.trim()) errs.code = "الكود مطلوب";
    if (!form.name.trim()) errs.name = "الاسم مطلوب";
    const exists = accounts.find((a) => a.code === form.code.trim() && a.id !== editId);
    if (exists) errs.code = "الكود موجود مسبقاً";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      const parent = form.parentId ? accounts.find((a) => a.id === form.parentId) : null;
      if (editId) {
        accountService.update(editId, { ...form, level: parent ? parent.level + 1 : 0 });
      } else {
        accountService.create({ ...form, level: parent ? parent.level + 1 : 0, isActive: true });
      }
      setShowForm(false); setEditId(null); setForm(emptyForm); setErrors({}); load();
    } catch (err) { logger.error("ChartOfAccounts: save failed", err); }
  }

  if (treeMode) {
    return (
      <div>
        <div className="mb-4 flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
          <h3 className="text-lg font-bold text-white">شجرة الحسابات</h3>
        </div>
        <div className="rounded-xl border border-white/10 bg-card-bg p-4 shadow-sm">
          {accounts.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">دليل الحسابات فارغ. أضف حسابات من قسم "إدارة الحسابات".</p> : renderTree(rootAccounts)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
          <h3 className="text-lg font-bold text-white">إدارة الحسابات</h3>
        </div>
        <Button size="sm" onClick={() => { setEditId(null); setForm(emptyForm); setErrors({}); setShowForm(true); }}><Plus className="h-4 w-4 ml-1" /> إضافة حساب</Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-white/10 bg-card-bg p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">كود الحساب</label>
              <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.code ? "border-red-400" : "border-white/20")} />
              {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">اسم الحساب</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.name ? "border-red-400" : "border-white/20")} />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">الحساب الأب</label>
              <select value={form.parentId ?? ""} onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value || null }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500">
                <option value="">حساب رئيسي (مستوى 0)</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">نوع الحساب</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AccountType }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500">
                {(Object.entries(ACCOUNT_TYPE_LABELS) as [AccountType, string][]).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-400">ملاحظات</label>
              <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" size="sm">{editId ? "تحديث" : "إضافة"}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); setErrors({}); }}>إلغاء</Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-white/10 bg-card-bg p-4 shadow-sm">
        {accounts.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">لا توجد حسابات بعد</p> : renderTree(rootAccounts)}
      </div>
    </div>
  );
}

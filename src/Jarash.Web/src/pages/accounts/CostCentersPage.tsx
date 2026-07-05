import { useState, useEffect, useCallback } from "react";
import { Plus, Edit3, Trash2, ChevronDown, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { costCenterService } from "./accountsService";
import type { CostCenter } from "./accountsTypes";

const emptyForm = { code: "", name: "", parentId: null as string | null, notes: "" };

export default function CostCentersPage({ onBack }: { onBack: () => void }) {
  const [centers, setCenters] = useState<CostCenter[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const load = useCallback(() => { setCenters(costCenterService.getAll()); }, []);
  useEffect(() => { load(); }, [load]);

  const rootCenters = centers.filter((c) => c.parentId === null);

  function getChildren(parentId: string): CostCenter[] { return centers.filter((c) => c.parentId === parentId); }

  function renderTree(ccs: CostCenter[], level: number = 0) {
    return ccs.sort((a, b) => a.code.localeCompare(b.code)).map((c) => {
      const children = getChildren(c.id);
      return (
        <div key={c.id}>
          <div className={cn("flex items-center gap-2 py-2 px-2 hover:bg-white/5 rounded-lg transition-colors", level > 0 && "mr-6")} style={{ marginRight: level * 24 }}>
            <span className="inline-block w-4"><ChevronLeft className="h-4 w-4 text-slate-300" /></span>
            <span className="text-xs font-mono text-slate-400 w-14">{c.code}</span>
            <span className="flex-1 text-sm font-medium text-white">{c.name}</span>
            <span className="text-xs text-slate-400">({children.length || "ت终端"})</span>
            <div className="flex gap-1">
              <button onClick={() => { setEditId(c.id); setForm({ code: c.code, name: c.name, parentId: c.parentId, notes: c.notes }); setShowForm(true); setErrors({}); }}
                className="rounded p-1 text-slate-400 hover:bg-sky-50 hover:text-sky-600"><Edit3 className="h-3.5 w-3.5" /></button>
              <button onClick={() => { if (confirm("تأكيد الحذف؟")) { if (!costCenterService.delete(c.id)) alert("لا يمكن حذف مركز له أبناء"); load(); } }}
                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
          {children.length > 0 && renderTree(children, level + 1)}
        </div>
      );
    });
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.code.trim()) errs.code = "الكود مطلوب";
    if (!form.name.trim()) errs.name = "الاسم مطلوب";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      const parent = form.parentId ? centers.find((c) => c.id === form.parentId) : null;
      if (editId) costCenterService.update(editId, { ...form, level: parent ? parent.level + 1 : 0 });
      else costCenterService.create({ ...form, level: parent ? parent.level + 1 : 0 });
      setShowForm(false); setEditId(null); setForm(emptyForm); setErrors({}); load();
    } catch (err) { logger.error("CostCentersPage: save failed", err); }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
          <h3 className="text-lg font-bold text-white">مراكز التكلفة</h3>
        </div>
        <Button size="sm" onClick={() => { setEditId(null); setForm(emptyForm); setErrors({}); setShowForm(true); }}><Plus className="h-4 w-4 ml-1" /> إضافة مركز</Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-white/10 bg-card-bg p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="mb-1 block text-xs font-medium text-slate-400">كود المركز</label>
              <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.code ? "border-red-400" : "border-white/20")} />
              {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}</div>
            <div><label className="mb-1 block text-xs font-medium text-slate-400">اسم المركز</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.name ? "border-red-400" : "border-white/20")} />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}</div>
            <div><label className="mb-1 block text-xs font-medium text-slate-400">المركز الأب</label>
              <select value={form.parentId ?? ""} onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value || null }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500">
                <option value="">مركز رئيسي</option>
                {centers.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
              </select></div>
            <div><label className="mb-1 block text-xs font-medium text-slate-400">ملاحظات</label>
              <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" size="sm">{editId ? "تحديث" : "إضافة"}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); setErrors({}); }}>إلغاء</Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-white/10 bg-card-bg p-4 shadow-sm">
        {centers.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">لا توجد مراكز تكلفة بعد</p> : renderTree(rootCenters)}
      </div>
    </div>
  );
}

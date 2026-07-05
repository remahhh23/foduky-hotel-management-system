import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { usePermission } from "@/lib/permissions";
import { cashFundService } from "./cashService";

export default function FundOpen({ onBack }: { onBack: () => void }) {
  const { can } = usePermission();
  const [form, setForm] = useState({ name: "", initialBalance: 0, notes: "" });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = "اسم الصندوق مطلوب";
    if (form.initialBalance < 0) errs.initialBalance = "الرصيد لا يمكن أن يكون سالباً";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  if (!can("إدارة النقد")) {
    return (
      <div>
        <div className="mb-4 flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
          <h3 className="text-lg font-bold text-slate-800">فتح صندوق جديد</h3>
        </div>
        <p className="text-sm text-red-500">ليس لديك صلاحية الوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      cashFundService.open({ name: form.name.trim(), initialBalance: form.initialBalance, openedAt: new Date().toISOString().split("T")[0], status: "open", notes: form.notes });
      logger.info("FundOpen: opened", { name: form.name });
      onBack();
    } catch (err) {
      logger.error("FundOpen: failed", err);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-slate-800">فتح صندوق جديد</h3>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">اسم الصندوق</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-sky-500", errors.name ? "border-red-400" : "border-slate-300")} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">الرصيد الافتتاحي</label>
            <input type="number" min={0} value={form.initialBalance} onChange={(e) => setForm((f) => ({ ...f, initialBalance: Number(e.target.value) }))}
              className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.initialBalance ? "border-red-400" : "border-slate-300")} />
            {errors.initialBalance && <p className="mt-1 text-xs text-red-500">{errors.initialBalance}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">ملاحظات</label>
            <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500" />
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <Button type="submit">فتح الصندوق</Button>
          <Button type="button" variant="outline" onClick={onBack}>إلغاء</Button>
        </div>
      </form>
    </div>
  );
}

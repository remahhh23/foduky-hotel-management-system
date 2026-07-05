import { useState, useEffect } from "react";
import { ArrowLeft, Save, Building2 } from "lucide-react";
import { logger } from "@/lib/logger";

interface Props {
  onBack: () => void;
}

const STORAGE_KEY = "jarash_company_settings";

interface CompanyData {
  name: string;
  address: string;
  phone: string;
  taxNumber: string;
  email: string;
  website: string;
  crNumber: string;
}

const defaults: CompanyData = {
  name: "شركة جرش للفندقة والضيافة",
  address: "جرش، الأردن",
  phone: "+962-2-1234567",
  taxNumber: "1234567-1",
  email: "info@jarash-hotel.com",
  website: "www.jarash-hotel.com",
  crNumber: "2024-12345",
};

function read(): CompanyData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch { return defaults; }
}

function write(data: CompanyData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function CompanySettings({ onBack }: Props) {
  const [form, setForm] = useState<CompanyData>(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(read());
  }, []);

  function handleSave() {
    write(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    logger.info("CompanySettings: saved", { name: form.name });
  }

  return (
    <div className="rounded-lg bg-card-bg p-6 text-white shadow-md">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> رجوع
        </button>
        <Building2 className="h-5 w-5 text-sky-400" />
        <h3 className="text-lg font-bold">بيانات الشركة</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-slate-400">اسم الشركة *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">الهاتف</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">العنوان</label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">البريد الإلكتروني</label>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">الرقم الضريبي</label>
          <input value={form.taxNumber} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">الموقع الإلكتروني</label>
          <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">رقم السجل التجاري</label>
          <input value={form.crNumber} onChange={(e) => setForm({ ...form, crNumber: e.target.value })}
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button onClick={handleSave}
          className="flex items-center gap-1 rounded bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700 transition">
          <Save className="h-4 w-4" /> حفظ الإعدادات
        </button>
        {saved && <span className="text-sm text-green-400">✓ تم الحفظ</span>}
      </div>
    </div>
  );
}

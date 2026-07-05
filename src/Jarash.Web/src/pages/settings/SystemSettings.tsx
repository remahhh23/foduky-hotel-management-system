import { useState, useEffect } from "react";
import { ArrowLeft, Save, Globe, CalendarDays, Database, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import { logger } from "@/lib/logger";
import { usePermission } from "@/lib/permissions";
import ProtectedSection from "@/lib/ProtectedSection";

interface Props {
  onBack: () => void;
}

const SYSTEM_KEY = "jarash_system_settings";

interface SystemConfig {
  language: "ar" | "en";
  dateFormat: string;
  timeFormat: "12h" | "24h";
  weekStart: "Saturday" | "Sunday" | "Monday";
  fiscalYearStart: string;
  currencyDisplay: "symbol" | "code" | "name";
  decimalSeparator: "." | ",";
  logRetentionDays: number;
}

const defaults: SystemConfig = {
  language: "ar",
  dateFormat: "YYYY-MM-DD",
  timeFormat: "24h",
  weekStart: "Saturday",
  fiscalYearStart: "2026-01-01",
  currencyDisplay: "symbol",
  decimalSeparator: ".",
  logRetentionDays: 90,
};

function read(): SystemConfig {
  try {
    const raw = localStorage.getItem(SYSTEM_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch { return defaults; }
}

function write(data: SystemConfig) {
  localStorage.setItem(SYSTEM_KEY, JSON.stringify(data));
}

export default function SystemSettings({ onBack }: Props) {
  const { can } = usePermission();
  const [config, setConfig] = useState<SystemConfig>(defaults);
  const [saved, setSaved] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    setConfig(read());
  }, []);

  function handleSave() {
    write(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    logger.info("SystemSettings: saved", { language: config.language });
  }

  function handleClearData() {
    if (!confirm("تأكيد مسح جميع بيانات التطبيق؟\nهذا الإجراء لا يمكن التراجع عنه!")) return;
    setClearing(true);
    setTimeout(() => {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("jarash_"));
      keys.forEach((k) => localStorage.removeItem(k));
      setClearing(false);
      logger.info("SystemSettings: all jarash_ data cleared", { keys });
    }, 1500);
  }

  return (
    <div className="rounded-lg bg-card-bg p-6 text-white shadow-md">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> رجوع
        </button>
        <Globe className="h-5 w-5 text-sky-400" />
        <h3 className="text-lg font-bold">إعدادات النظام</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded border border-sky-500/30 bg-sky-500/10 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-sky-400"><Globe className="h-4 w-4" /> اللغة والتنسيق</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">لغة الواجهة</label>
              <select value={config.language} onChange={(e) => setConfig({ ...config, language: e.target.value as "ar" | "en" })}
                className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500">
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">تنسيق التاريخ</label>
              <select value={config.dateFormat} onChange={(e) => setConfig({ ...config, dateFormat: e.target.value })}
                className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500">
                <option>YYYY-MM-DD</option>
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">تنسيق الوقت</label>
              <select value={config.timeFormat} onChange={(e) => setConfig({ ...config, timeFormat: e.target.value as "12h" | "24h" })}
                className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500">
                <option value="24h">24 ساعة</option>
                <option value="12h">12 ساعة (AM/PM)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">بداية الأسبوع</label>
              <select value={config.weekStart} onChange={(e) => setConfig({ ...config, weekStart: e.target.value as SystemConfig["weekStart"] })}
                className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500">
                <option value="Saturday">السبت</option>
                <option value="Sunday">الأحد</option>
                <option value="Monday">الإثنين</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">عرض العملة</label>
              <select value={config.currencyDisplay} onChange={(e) => setConfig({ ...config, currencyDisplay: e.target.value as SystemConfig["currencyDisplay"] })}
                className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500">
                <option value="symbol">الرمز ($)</option>
                <option value="code">الكود (USD)</option>
                <option value="name">الاسم (دولار)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">فاصل الأرقام العشرية</label>
              <select value={config.decimalSeparator} onChange={(e) => setConfig({ ...config, decimalSeparator: e.target.value as "." | "," })}
                className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500">
                <option value=".">نقطة (1.50)</option>
                <option value=",">فاصلة (1,50)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded border border-teal-500/30 bg-teal-500/10 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-teal-400"><CalendarDays className="h-4 w-4" /> الإعدادات المالية</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">بداية السنة المالية</label>
              <input type="date" value={config.fiscalYearStart} onChange={(e) => setConfig({ ...config, fiscalYearStart: e.target.value })}
                className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">الاحتفاظ بسجل الأحداث (يوم)</label>
              <input type="number" min={7} max={730} value={config.logRetentionDays} onChange={(e) => setConfig({ ...config, logRetentionDays: parseInt(e.target.value) || 90 })}
                className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-teal-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button onClick={handleSave}
          className="flex items-center gap-1 rounded bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700 transition">
          <Save className="h-4 w-4" /> حفظ الإعدادات
        </button>
        {saved && <span className="text-sm text-green-400">✓ تم الحفظ</span>}
      </div>

      <ProtectedSection permission="الإعدادات">
        <div className="mt-8 border-t border-white/10 pt-6">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-red-400"><AlertTriangle className="h-4 w-4" /> صيانة قاعدة البيانات</h4>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleClearData} disabled={clearing}
              className="flex items-center gap-1 rounded bg-red-600/80 px-4 py-2 text-sm text-white hover:bg-red-600 transition disabled:opacity-50">
              {clearing ? <><RefreshCw className="h-4 w-4 animate-spin" /> جاري المسح...</> : <><Trash2 className="h-4 w-4" /> مسح جميع البيانات</>}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">تحذير: هذا الإجراء سيمسح جميع بيانات التطبيق المخزنة محلياً</p>
        </div>
      </ProtectedSection>
    </div>
  );
}

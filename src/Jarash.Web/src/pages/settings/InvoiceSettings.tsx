import { useState, useEffect } from "react";
import { ArrowLeft, Save, Plus, Trash2, Percent, Receipt } from "lucide-react";
import { logger } from "@/lib/logger";

interface Props {
  onBack: () => void;
}

const INVOICE_KEY = "jarash_settings_invoice";
const TAXES_KEY = "jarash_settings_taxes";

interface InvoiceConfig {
  prefix: string;
  nextNumber: number;
  showTax: boolean;
  showDiscount: boolean;
  footer: string;
  paperSize: "A4" | "A5" | "80mm";
}

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  isDefault: boolean;
}

const defaultInvoice: InvoiceConfig = {
  prefix: "INV-",
  nextNumber: 1,
  showTax: true,
  showDiscount: false,
  footer: "شكراً لتعاملكم معنا",
  paperSize: "A4",
};

function readInvoice(): InvoiceConfig {
  try {
    const raw = localStorage.getItem(INVOICE_KEY);
    return raw ? { ...defaultInvoice, ...JSON.parse(raw) } : defaultInvoice;
  } catch { return defaultInvoice; }
}

function writeInvoice(data: InvoiceConfig) {
  localStorage.setItem(INVOICE_KEY, JSON.stringify(data));
}

function readTaxes(): TaxRate[] {
  try {
    const raw = localStorage.getItem(TAXES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeTaxes(data: TaxRate[]) {
  localStorage.setItem(TAXES_KEY, JSON.stringify(data));
}

let idCounter = Date.now();
function nextId(): string { return `tax_${++idCounter}`; }

export default function InvoiceSettings({ onBack }: Props) {
  const [config, setConfig] = useState<InvoiceConfig>(defaultInvoice);
  const [taxes, setTaxes] = useState<TaxRate[]>([]);
  const [newTax, setNewTax] = useState({ name: "", rate: 0 });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConfig(readInvoice());
    const loaded = readTaxes();
    if (loaded.length === 0) {
      const defaults: TaxRate[] = [
        { id: nextId(), name: "ضريبة مبيعات", rate: 16, isDefault: true },
        { id: nextId(), name: "ضريبة خدمات", rate: 10, isDefault: false },
      ];
      writeTaxes(defaults);
      setTaxes(defaults);
    } else {
      setTaxes(loaded);
    }
  }, []);

  function handleSaveConfig() {
    writeInvoice(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    logger.info("InvoiceSettings: config saved");
  }

  function handleAddTax() {
    if (!newTax.name || newTax.rate <= 0) return;
    const tax: TaxRate = { id: nextId(), ...newTax, isDefault: taxes.length === 0 };
    const updated = [...taxes, tax];
    writeTaxes(updated);
    setTaxes(updated);
    setNewTax({ name: "", rate: 0 });
    logger.info("InvoiceSettings: tax added", { name: newTax.name, rate: newTax.rate });
  }

  function handleDeleteTax(id: string) {
    const updated = taxes.filter((t) => t.id !== id);
    writeTaxes(updated);
    setTaxes(updated);
    logger.info("InvoiceSettings: tax deleted", { id });
  }

  return (
    <div className="rounded-lg bg-card-bg p-6 text-white shadow-md">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> رجوع
        </button>
        <h3 className="text-lg font-bold">إعدادات الفواتير والضرائب</h3>
      </div>

      <div className="mb-6 rounded border border-sky-500/30 bg-sky-500/10 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-sky-400"><Receipt className="h-4 w-4" /> تنسيق الفواتير</h4>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">بادئة الرقم</label>
            <input value={config.prefix} onChange={(e) => setConfig({ ...config, prefix: e.target.value })}
              className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">الرقم التالي</label>
            <input type="number" value={config.nextNumber} onChange={(e) => setConfig({ ...config, nextNumber: parseInt(e.target.value) || 1 })}
              className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">حجم الورق</label>
            <select value={config.paperSize} onChange={(e) => setConfig({ ...config, paperSize: e.target.value as InvoiceConfig["paperSize"] })}
              className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500">
              <option value="A4">A4</option>
              <option value="A5">A5</option>
              <option value="80mm">80 مم</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={config.showTax} onChange={(e) => setConfig({ ...config, showTax: e.target.checked })} className="rounded" />
              إظهار الضريبة
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={config.showDiscount} onChange={(e) => setConfig({ ...config, showDiscount: e.target.checked })} className="rounded" />
              إظهار الخصم
            </label>
          </div>
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-xs text-slate-400">تذييل الفاتورة</label>
          <input value={config.footer} onChange={(e) => setConfig({ ...config, footer: e.target.value })}
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500" />
        </div>
        <button onClick={handleSaveConfig}
          className="mt-3 flex items-center gap-1 rounded bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700 transition">
          <Save className="h-4 w-4" /> حفظ {saved && <span className="text-green-300">✓</span>}
        </button>
      </div>

      <div className="rounded border border-amber-500/30 bg-amber-500/10 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-400"><Percent className="h-4 w-4" /> أنواع الضرائب</h4>

        <div className="mb-3 flex gap-2">
          <input placeholder="اسم الضريبة" value={newTax.name} onChange={(e) => setNewTax({ ...newTax, name: e.target.value })}
            className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-amber-500 placeholder:text-slate-500" />
          <input type="number" placeholder="النسبة %" value={newTax.rate || ""} onChange={(e) => setNewTax({ ...newTax, rate: parseFloat(e.target.value) || 0 })}
            className="w-24 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-amber-500 placeholder:text-slate-500" />
          <button onClick={handleAddTax}
            className="flex items-center gap-1 rounded bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700 transition">
            <Plus className="h-4 w-4" /> إضافة
          </button>
        </div>

        <div className="space-y-2">
          {taxes.length === 0 ? (
            <div className="py-2 text-center text-sm text-slate-500">لا توجد ضرائب مضافة</div>
          ) : (
            taxes.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded bg-white/5 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{t.name}</span>
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400" dir="ltr">{t.rate}%</span>
                  {t.isDefault && <span className="text-[10px] text-slate-500">(افتراضي)</span>}
                </div>
                <button onClick={() => handleDeleteTax(t.id)} className="text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

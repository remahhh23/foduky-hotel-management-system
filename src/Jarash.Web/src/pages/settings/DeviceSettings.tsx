import { useState, useEffect } from "react";
import { ArrowLeft, Save, Monitor, Scan, Printer, CreditCard, Usb, Wifi } from "lucide-react";
import { logger } from "@/lib/logger";

interface Props {
  onBack: () => void;
}

const DEVICE_KEY = "jarash_device_settings";

interface DeviceConfig {
  barcode: { enabled: boolean; port: string; prefix: string };
  cashDrawer: { enabled: boolean; port: string; openCommand: string };
  printer: { enabled: boolean; name: string; paperSize: string; copies: number };
  cardReader: { enabled: boolean; type: string };
}

const defaults: DeviceConfig = {
  barcode: { enabled: true, port: "COM1", prefix: "" },
  cashDrawer: { enabled: true, port: "COM2", openCommand: "ESC|p|0|50|10" },
  printer: { enabled: true, name: "EPSON TM-T88", paperSize: "80mm", copies: 1 },
  cardReader: { enabled: false, type: "USB" },
};

function read(): DeviceConfig {
  try {
    const raw = localStorage.getItem(DEVICE_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch { return defaults; }
}

function write(data: DeviceConfig) {
  localStorage.setItem(DEVICE_KEY, JSON.stringify(data));
}

export default function DeviceSettings({ onBack }: Props) {
  const [config, setConfig] = useState<DeviceConfig>(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConfig(read());
  }, []);

  function handleSave() {
    write(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    logger.info("DeviceSettings: saved");
  }

  function updateSection<T extends keyof DeviceConfig>(section: T, value: DeviceConfig[T]) {
    setConfig((prev) => ({ ...prev, [section]: value }));
  }

  return (
    <div className="rounded-lg bg-card-bg p-6 text-white shadow-md">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> رجوع
        </button>
        <Monitor className="h-5 w-5 text-sky-400" />
        <h3 className="text-lg font-bold">إعدادات الأجهزة</h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="rounded border border-sky-500/30 bg-sky-500/10 p-4">
          <label className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-bold text-sky-400"><Scan className="h-4 w-4" /> قارئ الباركود</span>
            <input type="checkbox" checked={config.barcode.enabled} onChange={(e) => updateSection("barcode", { ...config.barcode, enabled: e.target.checked })} className="rounded" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">المنفذ</label>
              <select value={config.barcode.port} onChange={(e) => updateSection("barcode", { ...config.barcode, port: e.target.value })}
                className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500">
                <option>COM1</option><option>COM2</option><option>COM3</option><option>USB</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">بادئة الرمز</label>
              <input value={config.barcode.prefix} onChange={(e) => updateSection("barcode", { ...config.barcode, prefix: e.target.value })}
                className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500" />
            </div>
          </div>
        </div>

        <div className="rounded border border-teal-500/30 bg-teal-500/10 p-4">
          <label className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-bold text-teal-400"><Usb className="h-4 w-4" /> درج النقد</span>
            <input type="checkbox" checked={config.cashDrawer.enabled} onChange={(e) => updateSection("cashDrawer", { ...config.cashDrawer, enabled: e.target.checked })} className="rounded" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">المنفذ</label>
              <select value={config.cashDrawer.port} onChange={(e) => updateSection("cashDrawer", { ...config.cashDrawer, port: e.target.value })}
                className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-teal-500">
                <option>COM1</option><option>COM2</option><option>COM3</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">أمر الفتح</label>
              <input value={config.cashDrawer.openCommand} onChange={(e) => updateSection("cashDrawer", { ...config.cashDrawer, openCommand: e.target.value })}
                className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-teal-500" dir="ltr" />
            </div>
          </div>
        </div>

        <div className="rounded border border-amber-500/30 bg-amber-500/10 p-4">
          <label className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-bold text-amber-400"><Printer className="h-4 w-4" /> الطابعة</span>
            <input type="checkbox" checked={config.printer.enabled} onChange={(e) => updateSection("printer", { ...config.printer, enabled: e.target.checked })} className="rounded" />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">اسم الطابعة</label>
              <input value={config.printer.name} onChange={(e) => updateSection("printer", { ...config.printer, name: e.target.value })}
                className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">حجم الورق</label>
              <select value={config.printer.paperSize} onChange={(e) => updateSection("printer", { ...config.printer, paperSize: e.target.value })}
                className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-amber-500">
                <option>80mm</option><option>A4</option><option>A5</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">عدد النسخ</label>
              <input type="number" min={1} max={10} value={config.printer.copies} onChange={(e) => updateSection("printer", { ...config.printer, copies: parseInt(e.target.value) || 1 })}
                className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-amber-500" />
            </div>
          </div>
        </div>

        <div className="rounded border border-purple-500/30 bg-purple-500/10 p-4">
          <label className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-bold text-purple-400"><CreditCard className="h-4 w-4" /> قارئ البطاقات</span>
            <input type="checkbox" checked={config.cardReader.enabled} onChange={(e) => updateSection("cardReader", { ...config.cardReader, enabled: e.target.checked })} className="rounded" />
          </label>
          <div>
            <label className="mb-1 block text-xs text-slate-400">النوع</label>
            <select value={config.cardReader.type} onChange={(e) => updateSection("cardReader", { ...config.cardReader, type: e.target.value })}
              className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-purple-500">
              <option>USB</option><option>Bluetooth</option><option>WiFi</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button onClick={handleSave}
          className="flex items-center gap-1 rounded bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700 transition">
          <Save className="h-4 w-4" /> حفظ الإعدادات
        </button>
        {saved && <span className="mr-3 text-sm text-green-400">✓ تم الحفظ</span>}
      </div>
    </div>
  );
}

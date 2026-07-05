import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { cashFundService } from "@/pages/cash/cashService";

const HOTEL_SETTINGS_KEY = "jarash_settings_hotel";

interface HotelSettings {
  cashFundId: string;
}

function readSettings(): HotelSettings {
  try {
    const raw = localStorage.getItem(HOTEL_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { cashFundId: "" };
  } catch { return { cashFundId: "" }; }
}

function writeSettings(data: HotelSettings): void {
  try { localStorage.setItem(HOTEL_SETTINGS_KEY, JSON.stringify(data)); } catch { /* */ }
}

export function getHotelCashFundId(): string {
  return readSettings().cashFundId;
}

export default function HotelSettings({ onBack }: { onBack: () => void }) {
  const [openFunds, setOpenFunds] = useState<{ id: string; name: string }[]>([]);
  const [fundId, setFundId] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const funds = cashFundService.getOpen();
    setOpenFunds(funds);
    const settings = readSettings();
    if (settings.cashFundId && funds.some((f) => f.id === settings.cashFundId)) {
      setFundId(settings.cashFundId);
    } else if (funds.length > 0) {
      setFundId(funds[0].id);
    }
  }, []);

  function handleSave() {
    writeSettings({ cashFundId: fundId });
    setSaved(true);
    logger.info("HotelSettings: saved", { cashFundId: fundId });
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">إعدادات الفندق</h3>
      </div>

      <div className="max-w-lg rounded-xl border border-white/10 bg-card-bg p-6 shadow-sm">
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-400">الصندوق النقدي الافتراضي للفندق</label>
          <p className="mb-3 text-xs text-slate-500">إيرادات إنهاء إقامة النزلاء (المغادرة) ستذهب إلى هذا الصندوق</p>
          <select value={fundId} onChange={(e) => setFundId(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm outline-none focus:border-sky-500">
            <option value="">اختر الصندوق</option>
            {openFunds.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          {openFunds.length === 0 && (
            <p className="mt-1 text-xs text-amber-500">لا توجد صناديق نقدية مفتوحة. قم بإنشاء صندوق من قسم إدارة النقد أولاً.</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={!fundId}>
            {saved ? "تم الحفظ ✓" : "حفظ الإعدادات"}
          </Button>
        </div>
      </div>
    </div>
  );
}

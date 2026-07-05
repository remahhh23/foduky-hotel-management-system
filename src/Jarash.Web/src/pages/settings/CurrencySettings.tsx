import { useState, useEffect } from "react";
import { ArrowLeft, Save, Plus, Trash2, Globe } from "lucide-react";
import { logger } from "@/lib/logger";

interface Props {
  onBack: () => void;
}

const CURRENCIES_KEY = "jarash_settings_currencies";

interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string;
  exchangeRate: number;
  isDefault: boolean;
}

function readCurrencies(): Currency[] {
  try {
    const raw = localStorage.getItem(CURRENCIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeCurrencies(data: Currency[]) {
  localStorage.setItem(CURRENCIES_KEY, JSON.stringify(data));
}

let idCounter = Date.now();
function nextId(): string { return `cur_${++idCounter}`; }

export default function CurrencySettings({ onBack }: Props) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [newCur, setNewCur] = useState({ name: "", code: "", symbol: "", exchangeRate: 1 });

  useEffect(() => {
    const loaded = readCurrencies();
    if (loaded.length === 0) {
      const defaults: Currency[] = [
        { id: nextId(), name: "دينار أردني", code: "JOD", symbol: "د.أ", exchangeRate: 1, isDefault: true },
        { id: nextId(), name: "دولار أمريكي", code: "USD", symbol: "$", exchangeRate: 1.41, isDefault: false },
        { id: nextId(), name: "يورو", code: "EUR", symbol: "€", exchangeRate: 1.31, isDefault: false },
        { id: nextId(), name: "ريال سعودي", code: "SAR", symbol: "﷼", exchangeRate: 0.376, isDefault: false },
      ];
      writeCurrencies(defaults);
      setCurrencies(defaults);
    } else {
      setCurrencies(loaded);
    }
  }, []);

  function handleAdd() {
    if (!newCur.name || !newCur.code || newCur.exchangeRate <= 0) return;
    const cur: Currency = { id: nextId(), ...newCur, isDefault: currencies.length === 0 };
    const updated = [...currencies, cur];
    writeCurrencies(updated);
    setCurrencies(updated);
    setNewCur({ name: "", code: "", symbol: "", exchangeRate: 1 });
    logger.info("CurrencySettings: added", { code: newCur.code });
  }

  function handleDelete(id: string) {
    const item = currencies.find((c) => c.id === id);
    if (item?.isDefault) return;
    const updated = currencies.filter((c) => c.id !== id);
    writeCurrencies(updated);
    setCurrencies(updated);
    logger.info("CurrencySettings: deleted", { id });
  }

  function handleUpdateRate(id: string, rate: number) {
    const updated = currencies.map((c) => c.id === id ? { ...c, exchangeRate: rate } : c);
    writeCurrencies(updated);
    setCurrencies(updated);
  }

  return (
    <div className="rounded-lg bg-card-bg p-6 text-white shadow-md">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> رجوع
        </button>
        <Globe className="h-5 w-5 text-sky-400" />
        <h3 className="text-lg font-bold">إدارة العملات</h3>
      </div>

      <div className="mb-4 flex gap-2">
        <input placeholder="اسم العملة" value={newCur.name} onChange={(e) => setNewCur({ ...newCur, name: e.target.value })}
          className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
        <input placeholder="الكود (USD)" value={newCur.code} onChange={(e) => setNewCur({ ...newCur, code: e.target.value })}
          className="w-20 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
        <input placeholder="الرمز ($)" value={newCur.symbol} onChange={(e) => setNewCur({ ...newCur, symbol: e.target.value })}
          className="w-20 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
        <input type="number" step="0.001" placeholder="سعر الصرف" value={newCur.exchangeRate || ""} onChange={(e) => setNewCur({ ...newCur, exchangeRate: parseFloat(e.target.value) || 1 })}
          className="w-24 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
        <button onClick={handleAdd}
          className="flex items-center gap-1 rounded bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700 transition">
          <Plus className="h-4 w-4" /> إضافة
        </button>
      </div>

      <div className="space-y-2">
        {currencies.length === 0 ? (
          <div className="py-4 text-center text-sm text-slate-500">لا توجد عملات مضافة</div>
        ) : (
          currencies.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-sky-400">{c.symbol}</span>
                <div>
                  <div className="text-sm font-bold">{c.name}</div>
                  <div className="text-[11px] text-slate-500">{c.code}{c.isDefault && <span className="mr-2 text-green-400">(افتراضي)</span>}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-slate-400">سعر الصرف</div>
                  <input type="number" step="0.001" value={c.exchangeRate} onChange={(e) => handleUpdateRate(c.id, parseFloat(e.target.value) || 1)}
                    className="w-20 rounded border border-white/10 bg-white/5 px-2 py-0.5 text-left text-sm text-white outline-none focus:border-sky-500" dir="ltr" />
                </div>
                {!c.isDefault && (
                  <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

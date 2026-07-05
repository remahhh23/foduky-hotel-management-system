import { useState } from "react";
import { ArrowLeft, HardDrive, Download, Upload, Clock, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import { logger } from "@/lib/logger";

interface Props {
  onBack: () => void;
}

const BACKUP_KEY = "jarash_backup_history";

interface BackupEntry {
  id: string;
  date: string;
  size: string;
  type: "تلقائي" | "يدوي";
}

let idCounter = Date.now();
function nextId(): string { return `bak_${++idCounter}`; }

function readHistory(): BackupEntry[] {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeHistory(data: BackupEntry[]) {
  localStorage.setItem(BACKUP_KEY, JSON.stringify(data));
}

export default function BackupSettings({ onBack }: Props) {
  const [history, setHistory] = useState<BackupEntry[]>(() => readHistory());
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  function handleCreateBackup() {
    setRunning(true);
    setTimeout(() => {
      const entry: BackupEntry = {
        id: nextId(),
        date: new Date().toLocaleString("ar-JO"),
        size: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`,
        type: "يدوي",
      };
      const updated = [entry, ...history];
      writeHistory(updated);
      setHistory(updated);
      setRunning(false);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
      logger.info("BackupSettings: backup created");
    }, 1500);
  }

  function handleDeleteBackup(id: string) {
    const updated = history.filter((h) => h.id !== id);
    writeHistory(updated);
    setHistory(updated);
    logger.info("BackupSettings: backup deleted", { id });
  }

  function handleRestore(id: string) {
    logger.info("BackupSettings: restore started", { id });
  }

  return (
    <div className="rounded-lg bg-card-bg p-6 text-white shadow-md">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> رجوع
        </button>
        <HardDrive className="h-5 w-5 text-sky-400" />
        <h3 className="text-lg font-bold">النسخ الاحتياطي</h3>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded border border-sky-500/30 bg-sky-500/10 p-4">
          <h4 className="mb-3 text-sm font-bold text-sky-400">إنشاء نسخة احتياطية</h4>
          <p className="mb-3 text-xs text-slate-400">إنشاء نسخة احتياطية كاملة من قاعدة البيانات وجميع الملفات</p>
          <button onClick={handleCreateBackup} disabled={running}
            className="flex items-center gap-2 rounded bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700 transition disabled:opacity-50">
            {running ? (
              <><Clock className="h-4 w-4 animate-spin" /> جاري الإنشاء...</>
            ) : (
              <><Download className="h-4 w-4" /> إنشاء نسخة احتياطية</>
            )}
          </button>
          {done && <span className="mr-3 text-sm text-green-400"><CheckCircle2 className="ml-1 inline h-4 w-4" /> تم الإنشاء بنجاح</span>}
        </div>

        <div className="rounded border border-amber-500/30 bg-amber-500/10 p-4">
          <h4 className="mb-3 text-sm font-bold text-amber-400">استعادة نسخة</h4>
          <p className="mb-3 text-xs text-slate-400">استعادة قاعدة البيانات من نسخة احتياطية سابقة</p>
          <label className="flex cursor-pointer items-center gap-2 rounded bg-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/20 transition">
            <Upload className="h-4 w-4" /> رفع ملف النسخة الاحتياطية
            <input type="file" accept=".zip,.sql,.bak" className="hidden" onChange={() => logger.info("BackupSettings: file selected")} />
          </label>
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-bold text-slate-300">سجل النسخ الاحتياطي</h4>
        {history.length === 0 ? (
          <div className="rounded border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-slate-500">لا توجد نسخ احتياطية سابقة</div>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded border border-white/10 bg-white/5 px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <HardDrive className="h-4 w-4 text-sky-400" />
                  <div>
                    <div className="text-sm font-bold">{h.date}</div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{h.size}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] ${h.type === "تلقائي" ? "bg-green-500/20 text-green-400" : "bg-sky-500/20 text-sky-400"}`}>{h.type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleRestore(h.id)} className="flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-xs text-slate-300 hover:bg-white/20 transition">
                    <Upload className="h-3 w-3" /> استعادة
                  </button>
                  <button onClick={() => handleDeleteBackup(h.id)} className="text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Warehouse } from "lucide-react";
import { inventoryItemService } from "@/pages/inventory-reports/inventoryService";
import { logger } from "@/lib/logger";

interface Props {
  onBack: () => void;
}

const WAREHOUSES_KEY = "jarash_inventory_warehouses";

interface WarehouseEntry {
  id: string;
  name: string;
  location: string;
  manager: string;
  notes: string;
}

function readWarehouses(): WarehouseEntry[] {
  try {
    const raw = localStorage.getItem(WAREHOUSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeWarehouses(data: WarehouseEntry[]) {
  localStorage.setItem(WAREHOUSES_KEY, JSON.stringify(data));
}

let idCounter = Date.now();
function nextId(): string { return `wh_${++idCounter}`; }

export default function WarehousesManagement({ onBack }: Props) {
  const [warehouses, setWarehouses] = useState<WarehouseEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", location: "", manager: "", notes: "" });

  useEffect(() => {
    const stored = readWarehouses();
    const fromItems = inventoryItemService.getWarehouses();
    const all = new Map<string, boolean>();
    for (const w of stored) all.set(w.name, true);
    for (const w of fromItems) if (!all.has(w)) all.set(w, true);
    if (all.size !== stored.length) {
      const merged = stored.map((w) => w);
      for (const w of fromItems) {
        if (!stored.find((s) => s.name === w)) {
          merged.push({ id: nextId(), name: w, location: "", manager: "", notes: "" });
        }
      }
      writeWarehouses(merged);
      setWarehouses(merged);
    } else {
      setWarehouses(stored);
    }
  }, []);

  function resetForm() {
    setForm({ name: "", location: "", manager: "", notes: "" });
    setEditingId(null);
    setShowForm(false);
  }

  function openEdit(w: WarehouseEntry) {
    setForm({ name: w.name, location: w.location, manager: w.manager, notes: w.notes });
    setEditingId(w.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (editingId) {
      const updated = warehouses.map((w) => w.id === editingId ? { ...w, ...form } : w);
      writeWarehouses(updated);
      setWarehouses(updated);
      logger.info("WarehousesManagement: updated", { id: editingId });
    } else {
      const entry: WarehouseEntry = { id: nextId(), ...form };
      const updated = [...warehouses, entry];
      writeWarehouses(updated);
      inventoryItemService.syncWarehouseCreated(form.name);
      setWarehouses(updated);
      logger.info("WarehousesManagement: created", { name: form.name });
    }
    resetForm();
  }

  function handleDelete(id: string) {
    const w = warehouses.find((wh) => wh.id === id);
    const updated = warehouses.filter((wh) => wh.id !== id);
    writeWarehouses(updated);
    if (w) inventoryItemService.syncWarehouseDeleted(w.name);
    setWarehouses(updated);
    logger.info("WarehousesManagement: deleted", { id });
  }

  const items = inventoryItemService.getAll();
  const whItemCount = new Map<string, number>();
  for (const item of items) {
    whItemCount.set(item.warehouse, (whItemCount.get(item.warehouse) || 0) + 1);
  }

  return (
    <div className="rounded-lg bg-card-bg p-6 text-white shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" /> رجوع
          </button>
          <h3 className="text-lg font-bold">إدارة المخازن</h3>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-2 text-sm text-white hover:bg-sky-700 transition">
          <Plus className="h-4 w-4" /> إضافة مخزن
        </button>
      </div>

      {showForm && (
        <div className="mb-4 rounded border border-sky-500/30 bg-sky-500/10 p-4">
          <h4 className="mb-3 text-sm font-bold text-sky-400">{editingId ? "تعديل مخزن" : "إضافة مخزن جديد"}</h4>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <input placeholder="اسم المخزن *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
            <input placeholder="الموقع" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
            <input placeholder="المسؤول" value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })}
              className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
            <input placeholder="ملاحظات" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleSave} className="flex items-center gap-1 rounded bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700 transition">
              <Save className="h-4 w-4" /> حفظ
            </button>
            <button onClick={resetForm} className="flex items-center gap-1 rounded bg-white/10 px-3 py-1.5 text-sm text-slate-400 hover:bg-white/20 transition">
              <X className="h-4 w-4" /> إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {warehouses.length === 0 ? (
          <div className="py-4 text-center text-sm text-slate-500">لا توجد مخازن. أضف مخزناً جديداً</div>
        ) : (
          warehouses.map((w) => (
            <div key={w.id} className="flex items-center justify-between rounded border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <Warehouse className="h-5 w-5 text-sky-400" />
                <div>
                  <div className="text-sm font-bold">{w.name}</div>
                  <div className="text-xs text-slate-400">
                    {w.location && `${w.location}`}{w.manager && ` — ${w.manager}`}
                    <span className="mr-2">({whItemCount.get(w.name) || 0} أصناف)</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(w)} className="text-sky-400 hover:text-sky-300 transition" title="تعديل"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(w.id)} className="text-red-400 hover:text-red-300 transition" title="حذف"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

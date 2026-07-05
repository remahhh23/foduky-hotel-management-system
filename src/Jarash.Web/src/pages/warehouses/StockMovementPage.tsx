import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { inventoryItemService, inventoryMovementService } from "@/pages/inventory-reports/inventoryService";
import { INBOUND_TYPES, MOVEMENT_TYPE_LABELS } from "@/pages/inventory-reports/inventoryTypes";
import type { InventoryItem, InventoryMovement } from "@/pages/inventory-reports/inventoryTypes";
import { logger } from "@/lib/logger";

interface Props {
  onBack: () => void;
  mode: "stock-in" | "stock-out" | "return";
}

const MODE_CONFIG = {
  "stock-in": { label: "إدخال مخزني", color: "text-green-400", border: "border-green-500/30", bg: "bg-green-500/10", movementType: "purchase_in" as const },
  "stock-out": { label: "إخراج مخزني", color: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/10", movementType: "sale_out" as const },
  "return": { label: "إرجاع أصناف", color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10", movementType: "return_in" as const },
};

export default function StockMovementPage({ onBack, mode }: Props) {
  const config = MODE_CONFIG[mode];
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setItems(inventoryItemService.getAll());
    setMovements(inventoryMovementService.getAll());
  }, []);

  const itemMovements = useMemo(() => {
    if (!selectedId) return [];
    return movements.filter((m) => m.itemId === selectedId).sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedId, movements]);

  function handleSave() {
    if (!selectedId || quantity <= 0) return;
    const item = items.find((i) => i.id === selectedId);
    if (!item) return;

    const isOutbound = mode === "stock-out";
    if (isOutbound && quantity > item.quantity) {
      logger.warn("StockMovement: insufficient stock", { item: item.name, available: item.quantity, requested: quantity });
      return;
    }

    const movement = inventoryMovementService.create({
      itemId: item.id,
      itemName: item.name,
      type: config.movementType,
      quantity,
      unitCost: item.unitCost,
      reference: reference || `${mode}_${Date.now()}`,
      notes,
      date: new Date().toISOString().slice(0, 10),
    });

    const delta = isOutbound ? -quantity : quantity;
    inventoryItemService.updateQuantity(item.id, delta);

    setMovements(inventoryMovementService.getAll());
    setItems(inventoryItemService.getAll());
    setQuantity(1);
    setReference("");
    setNotes("");
    logger.info("StockMovement: recorded", { mode, item: item.name, qty: quantity });
  }

  return (
    <div className="rounded-lg bg-card-bg p-6 text-white shadow-md">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> رجوع
        </button>
        <h3 className="text-lg font-bold">{config.label}</h3>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs text-slate-400">الصنف</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500">
            <option value="">اختر الصنف</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.sku}) — الرصيد: {i.quantity}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">الكمية</label>
          <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">المرجع</label>
          <input placeholder="رقم المرجع" value={reference} onChange={(e) => setReference(e.target.value)}
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">ملاحظات</label>
          <input placeholder="ملاحظات" value={notes} onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
        </div>
      </div>

      <button onClick={handleSave}
        className="mb-4 flex items-center gap-1 rounded bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700 transition">
        <Save className="h-4 w-4" /> تسجيل الحركة
      </button>

      <div className="mt-4">
        <h4 className="mb-2 text-sm font-bold text-slate-300">آخر الحركات</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-400">
                <th className="px-3 py-2 text-right">التاريخ</th>
                <th className="px-3 py-2 text-right">الصنف</th>
                <th className="px-3 py-2 text-right">النوع</th>
                <th className="px-3 py-2 text-left">الكمية</th>
                <th className="px-3 py-2 text-right">المرجع</th>
              </tr>
            </thead>
            <tbody>
              {itemMovements.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-4 text-center text-sm text-slate-500">لا توجد حركات لهذا الصنف</td></tr>
              ) : (
                itemMovements.slice(0, 10).map((m) => (
                  <tr key={m.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-1.5 text-sm text-slate-300">{m.date}</td>
                    <td className="px-3 py-1.5 text-sm">{m.itemName}</td>
                    <td className="px-3 py-1.5 text-sm text-slate-400">{MOVEMENT_TYPE_LABELS[m.type]}</td>
                    <td className={`px-3 py-1.5 text-left text-sm font-bold ${INBOUND_TYPES.includes(m.type) ? "text-green-400" : "text-red-400"}`} dir="ltr">{m.quantity}</td>
                    <td className="px-3 py-1.5 text-sm text-slate-500">{m.reference || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

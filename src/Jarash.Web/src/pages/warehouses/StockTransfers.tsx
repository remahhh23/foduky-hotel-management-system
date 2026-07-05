import { useState, useEffect } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { inventoryItemService, inventoryMovementService, inventoryTransferService } from "@/pages/inventory-reports/inventoryService";
import type { InventoryItem, InventoryTransfer } from "@/pages/inventory-reports/inventoryTypes";
import { logger } from "@/lib/logger";

interface Props {
  onBack: () => void;
}

export default function StockTransfers({ onBack }: Props) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transfers, setTransfers] = useState<InventoryTransfer[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [fromWh, setFromWh] = useState("");
  const [toWh, setToWh] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setItems(inventoryItemService.getAll());
    setTransfers(inventoryTransferService.getAll());
  }, []);

  const warehouses = [...new Set(items.map((i) => i.warehouse))].sort();

  function handleTransfer() {
    if (!selectedId || !fromWh || !toWh || quantity <= 0) return;
    if (fromWh === toWh) { logger.warn("StockTransfers: same warehouse"); return; }
    const item = items.find((i) => i.id === selectedId);
    if (!item) return;
    if (item.warehouse !== fromWh) { logger.warn("StockTransfers: item not in source warehouse"); return; }
    if (quantity > item.quantity) { logger.warn("StockTransfers: insufficient stock"); return; }

    inventoryTransferService.create({
      itemId: item.id,
      itemName: item.name,
      quantity,
      fromWarehouse: fromWh,
      toWarehouse: toWh,
      reference: reference || `TR-${Date.now()}`,
      notes,
      date: new Date().toISOString().slice(0, 10),
    });

    inventoryMovementService.create({
      itemId: item.id, itemName: item.name, type: "transfer_out", quantity,
      unitCost: item.unitCost, reference: reference || `TR-${Date.now()}`,
      notes: `تحويل من ${fromWh} إلى ${toWh}`,
      date: new Date().toISOString().slice(0, 10),
    });

    inventoryMovementService.create({
      itemId: item.id, itemName: item.name, type: "transfer_in", quantity,
      unitCost: item.unitCost, reference: reference || `TR-${Date.now()}`,
      notes: `تحويل من ${fromWh} إلى ${toWh}`,
      date: new Date().toISOString().slice(0, 10),
    });

    inventoryItemService.update(item.id, { warehouse: toWh });

    setItems(inventoryItemService.getAll());
    setTransfers(inventoryTransferService.getAll());
    setQuantity(1);
    setReference("");
    setNotes("");
    logger.info("StockTransfers: completed", { item: item.name, from: fromWh, to: toWh, qty: quantity });
  }

  const filteredItems = items.filter((i) => !fromWh || i.warehouse === fromWh);

  return (
    <div className="rounded-lg bg-card-bg p-6 text-white shadow-md">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> رجوع
        </button>
        <h3 className="text-lg font-bold">تحويل بين المخازن</h3>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-slate-400">من مخزن</label>
          <select value={fromWh} onChange={(e) => setFromWh(e.target.value)}
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500">
            <option value="">اختر المخزن المصدر</option>
            {warehouses.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">إلى مخزن</label>
          <select value={toWh} onChange={(e) => setToWh(e.target.value)}
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500">
            <option value="">اختر المخزن الهدف</option>
            {warehouses.filter((w) => w !== fromWh).map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">الصنف</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500">
            <option value="">اختر الصنف</option>
            {filteredItems.map((i) => (
              <option key={i.id} value={i.id}>{i.name} (الرصيد: {i.quantity})</option>
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

      <button onClick={handleTransfer}
        className="mb-4 flex items-center gap-1 rounded bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700 transition">
        <Save className="h-4 w-4" /> تنفيذ التحويل
      </button>

      <div className="overflow-x-auto">
        <h4 className="mb-2 text-sm font-bold text-slate-300">سجل التحويلات</h4>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400">
              <th className="px-3 py-2 text-right">التاريخ</th>
              <th className="px-3 py-2 text-right">الصنف</th>
              <th className="px-3 py-2 text-left">الكمية</th>
              <th className="px-3 py-2 text-right">من</th>
              <th className="px-3 py-2 text-right">إلى</th>
              <th className="px-3 py-2 text-right">المرجع</th>
            </tr>
          </thead>
          <tbody>
            {transfers.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-sm text-slate-500">لا توجد تحويلات</td></tr>
            ) : (
              transfers.slice().reverse().map((t) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-1.5 text-sm text-slate-300">{t.date}</td>
                  <td className="px-3 py-1.5 text-sm">{t.itemName}</td>
                  <td className="px-3 py-1.5 text-left text-sm font-bold" dir="ltr">{t.quantity}</td>
                  <td className="px-3 py-1.5 text-sm text-amber-400">{t.fromWarehouse}</td>
                  <td className="px-3 py-1.5 text-sm text-green-400">{t.toWarehouse}</td>
                  <td className="px-3 py-1.5 text-sm text-slate-500">{t.reference || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { inventoryItemService, inventoryMovementService } from "./inventoryService";
import { MOVEMENT_TYPE_LABELS, INBOUND_TYPES } from "./inventoryTypes";
import type { InventoryItem, InventoryMovement } from "./inventoryTypes";

export function ItemMovementsReport() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    setItems(inventoryItemService.getAll());
  }, []);

  useEffect(() => {
    if (!selectedId) { setMovements([]); return; }
    let list = inventoryMovementService.getByItem(selectedId);
    if (fromDate) list = list.filter((m) => m.date >= fromDate);
    if (toDate) list = list.filter((m) => m.date <= toDate);
    setMovements(list);
  }, [selectedId, fromDate, toDate]);

  const totalIn = movements.filter((m) => INBOUND_TYPES.includes(m.type)).reduce((s, m) => s + m.quantity, 0);
  const totalOut = movements.filter((m) => !INBOUND_TYPES.includes(m.type)).reduce((s, m) => s + m.quantity, 0);

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-teal-400">حركة الأصناف</h2>

      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-xs text-gray-400">الصنف</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
            className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-teal-500">
            <option value="">اختر الصنف</option>
            {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">من تاريخ</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
            className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-teal-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">إلى تاريخ</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
            className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-teal-500" />
        </div>
      </div>

      {selectedId && (
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="rounded bg-green-500/10 p-3 text-center">
            <div className="text-xs text-gray-400">إجمالي الوارد</div>
            <div className="text-lg font-bold text-green-400" dir="ltr">{totalIn.toLocaleString("en-US")}</div>
          </div>
          <div className="rounded bg-red-500/10 p-3 text-center">
            <div className="text-xs text-gray-400">إجمالي الصادر</div>
            <div className="text-lg font-bold text-red-400" dir="ltr">{totalOut.toLocaleString("en-US")}</div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">التاريخ</th>
              <th className="px-3 py-2 text-right">النوع</th>
              <th className="px-3 py-2 text-right">الكمية</th>
              <th className="px-3 py-2 text-right">المرجع</th>
              <th className="px-3 py-2 text-right">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-400">لا توجد حركات</td></tr>
            ) : (
              movements.map((m) => (
                <tr key={m.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-1.5 text-sm text-gray-300">{m.date}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-400">{MOVEMENT_TYPE_LABELS[m.type]}</td>
                  <td className={`px-3 py-1.5 text-sm font-bold ${INBOUND_TYPES.includes(m.type) ? "text-green-400" : "text-red-400"}`} dir="ltr">{INBOUND_TYPES.includes(m.type) ? "+" : "-"}{m.quantity}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-400">{m.reference || "—"}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-400">{m.notes || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

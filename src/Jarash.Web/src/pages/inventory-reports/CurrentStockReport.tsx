import { useState, useEffect, useMemo } from "react";
import { inventoryItemService } from "./inventoryService";
import type { InventoryItem } from "./inventoryTypes";

export function CurrentStockReport() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filterCat, setFilterCat] = useState("");
  const [filterWh, setFilterWh] = useState("");

  useEffect(() => {
    setItems(inventoryItemService.getAll());
  }, []);

  const categories = useMemo(() => inventoryItemService.getCategories(), [items]);
  const warehouses = useMemo(() => inventoryItemService.getWarehouses(), [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (filterCat) list = list.filter((i) => i.category === filterCat);
    if (filterWh) list = list.filter((i) => i.warehouse === filterWh);
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [items, filterCat, filterWh]);

  const totalItems = filtered.length;
  const totalQty = filtered.reduce((s, i) => s + i.quantity, 0);
  const totalValue = filtered.reduce((s, i) => s + i.quantity * i.unitCost, 0);

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-teal-400">المخزون الحالي</h2>

      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-xs text-gray-400">التصنيف</label>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
            className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-teal-500">
            <option value="">الكل</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">المستودع</label>
          <select value={filterWh} onChange={(e) => setFilterWh(e.target.value)}
            className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-teal-500">
            <option value="">الكل</option>
            {warehouses.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="rounded bg-white/5 p-3 text-center">
          <div className="text-xs text-gray-400">عدد الأصناف</div>
          <div className="text-lg font-bold text-white">{totalItems}</div>
        </div>
        <div className="rounded bg-blue-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">إجمالي الكمية</div>
          <div className="text-lg font-bold text-blue-400" dir="ltr">{totalQty.toLocaleString("en-US")}</div>
        </div>
        <div className="rounded bg-green-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">إجمالي القيمة</div>
          <div className="text-lg font-bold text-green-400" dir="ltr">{totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">الاسم</th>
              <th className="px-3 py-2 text-right">SKU</th>
              <th className="px-3 py-2 text-right">التصنيف</th>
              <th className="px-3 py-2 text-right">المستودع</th>
              <th className="px-3 py-2 text-left">الكمية</th>
              <th className="px-3 py-2 text-left">تكلفة الوحدة</th>
              <th className="px-3 py-2 text-left">القيمة الإجمالية</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-sm text-gray-400">لا توجد أصناف</td></tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-1.5 text-sm text-gray-300">{item.name}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-400">{item.sku}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-400">{item.category}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-400">{item.warehouse}</td>
                  <td className={`px-3 py-1.5 text-left text-sm font-bold ${item.quantity <= item.reorderLevel && item.quantity > 0 ? "text-amber-400" : item.quantity <= 0 ? "text-red-400" : "text-white"}`} dir="ltr">{item.quantity}</td>
                  <td className="px-3 py-1.5 text-left text-sm text-gray-300" dir="ltr">{item.unitCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td className="px-3 py-1.5 text-left text-sm text-green-400" dir="ltr">{(item.quantity * item.unitCost).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { ArrowLeft, Save, ClipboardCheck } from "lucide-react";
import { inventoryItemService, inventoryCountService } from "@/pages/inventory-reports/inventoryService";
import type { InventoryItem, InventoryCount } from "@/pages/inventory-reports/inventoryTypes";
import { logger } from "@/lib/logger";

interface Props {
  onBack: () => void;
  mode: "count" | "adjust";
}

export default function StockCounting({ onBack, mode }: Props) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [actualQty, setActualQty] = useState(0);
  const [notes, setNotes] = useState("");
  const [filterCat, setFilterCat] = useState("");

  useEffect(() => {
    setItems(inventoryItemService.getAll());
    setCounts(inventoryCountService.getAll());
  }, []);

  const selectedItem = items.find((i) => i.id === selectedId);
  const categories = [...new Set(items.map((i) => i.category))].sort();
  const filteredItems = items.filter((i) => !filterCat || i.category === filterCat);

  function handleSave() {
    if (!selectedId || actualQty < 0) return;
    const item = items.find((i) => i.id === selectedId);
    if (!item) return;

    const diff = actualQty - item.quantity;

    if (mode === "adjust" && diff !== 0) {
      inventoryItemService.update(selectedId, { quantity: actualQty });
      inventoryCountService.create({
        itemId: item.id, itemName: item.name, warehouse: item.warehouse,
        expectedQty: item.quantity, actualQty, difference: diff, notes,
        date: new Date().toISOString().slice(0, 10),
      });
    } else if (mode === "count") {
      inventoryCountService.create({
        itemId: item.id, itemName: item.name, warehouse: item.warehouse,
        expectedQty: item.quantity, actualQty, difference: diff, notes,
        date: new Date().toISOString().slice(0, 10),
      });
    }

    setItems(inventoryItemService.getAll());
    setCounts(inventoryCountService.getAll());
    setSelectedId("");
    setActualQty(0);
    setNotes("");
    logger.info("StockCounting: recorded", { mode, item: item.name, expected: item.quantity, actual: actualQty });
  }

  const withDiff = counts.filter((c) => c.difference !== 0);
  const recentCounts = [...counts].reverse().slice(0, 10);

  return (
    <div className="rounded-lg bg-card-bg p-6 text-white shadow-md">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> رجوع
        </button>
        <h3 className="text-lg font-bold">{mode === "count" ? "جرد المخزون" : "تسويات الجرد"}</h3>
      </div>

      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-xs text-slate-400">التصنيف</label>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
            className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500">
            <option value="">جميع التصنيفات</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">الصنف</label>
          <select value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setActualQty(items.find((i) => i.id === e.target.value)?.quantity ?? 0); }}
            className="w-64 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500">
            <option value="">اختر الصنف</option>
            {filteredItems.map((i) => (
              <option key={i.id} value={i.id}>{i.name} ({i.sku}) — الرصيد: {i.quantity}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedItem && (
        <div className="mb-4 rounded border border-sky-500/30 bg-sky-500/10 p-4">
          <div className="mb-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div>
              <span className="text-xs text-slate-400">الصنف: </span>
              <span className="text-sm font-bold">{selectedItem.name}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400">الرصيد الدفتري: </span>
              <span className="text-sm font-bold" dir="ltr">{selectedItem.quantity}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400">المستودع: </span>
              <span className="text-sm">{selectedItem.warehouse}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400">المخزن الفعلي: </span>
              <input type="number" min={0} value={actualQty} onChange={(e) => setActualQty(parseInt(e.target.value) || 0)}
                className="w-24 rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none focus:border-sky-500" />
            </div>
          </div>
          {mode === "adjust" && actualQty !== selectedItem.quantity && (
            <div className="mb-2 rounded bg-amber-500/10 p-2 text-sm text-amber-400">
              الفرق: {actualQty - selectedItem.quantity > 0 ? "+" : ""}{actualQty - selectedItem.quantity}
              {mode === "adjust" && " — سيتم تحديث الرصيد"}
            </div>
          )}
          <input placeholder="ملاحظات" value={notes} onChange={(e) => setNotes(e.target.value)}
            className="mb-3 w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
          <button onClick={handleSave}
            className="flex items-center gap-1 rounded bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700 transition">
            <Save className="h-4 w-4" /> {mode === "count" ? "تسجيل الجرد" : "تسوية الرصيد"}
          </button>
        </div>
      )}

      {withDiff.length > 0 && (
        <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 p-3">
          <span className="text-sm font-bold text-red-400">تنبيه: </span>
          <span className="text-sm text-slate-300">{withDiff.length} صنف لديه فروقات في الجرد</span>
        </div>
      )}

      <div>
        <h4 className="mb-2 text-sm font-bold text-slate-300">آخر الجردات</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-400">
                <th className="px-3 py-2 text-right">التاريخ</th>
                <th className="px-3 py-2 text-right">الصنف</th>
                <th className="px-3 py-2 text-left">متوقع</th>
                <th className="px-3 py-2 text-left">فعلي</th>
                <th className="px-3 py-2 text-left">الفرق</th>
                <th className="px-3 py-2 text-right">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {recentCounts.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-4 text-center text-sm text-slate-500">لا توجد جردات مسجلة</td></tr>
              ) : (
                recentCounts.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-1.5 text-sm text-slate-300">{c.date}</td>
                    <td className="px-3 py-1.5 text-sm">{c.itemName}</td>
                    <td className="px-3 py-1.5 text-left text-sm" dir="ltr">{c.expectedQty}</td>
                    <td className="px-3 py-1.5 text-left text-sm" dir="ltr">{c.actualQty}</td>
                    <td className={`px-3 py-1.5 text-left text-sm font-bold ${c.difference === 0 ? "text-green-400" : "text-red-400"}`} dir="ltr">{c.difference > 0 ? "+" : ""}{c.difference}</td>
                    <td className="px-3 py-1.5 text-sm text-slate-500">{c.notes || "—"}</td>
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

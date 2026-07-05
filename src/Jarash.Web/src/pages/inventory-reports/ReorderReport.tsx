import { useState, useEffect, useMemo } from "react";
import { inventoryItemService } from "./inventoryService";
import type { InventoryItem } from "./inventoryTypes";

export function ReorderReport() {
  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    setItems(inventoryItemService.getAll());
  }, []);

  const report = useMemo(() => {
    return items
      .filter((i) => i.quantity <= i.reorderLevel)
      .sort((a, b) => {
        const aRatio = a.quantity / a.reorderLevel;
        const bRatio = b.quantity / b.reorderLevel;
        return aRatio - bRatio;
      });
  }, [items]);

  const outOfStock = report.filter((i) => i.quantity <= 0);
  const lowStock = report.filter((i) => i.quantity > 0);

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-amber-400">حد إعادة الطلب</h2>
      <p className="mb-4 text-sm text-gray-400">الأصناف التي وصلت أو تجاوزت حد إعادة الطلب</p>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="rounded bg-red-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">نفد من المخزون</div>
          <div className="text-lg font-bold text-red-400">{outOfStock.length}</div>
        </div>
        <div className="rounded bg-amber-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">دون حد الطلب</div>
          <div className="text-lg font-bold text-amber-400">{lowStock.length}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">الصنف</th>
              <th className="px-3 py-2 text-right">SKU</th>
              <th className="px-3 py-2 text-right">المستودع</th>
              <th className="px-3 py-2 text-left">الكمية الحالية</th>
              <th className="px-3 py-2 text-left">حد الطلب</th>
              <th className="px-3 py-2 text-left">الكمية المطلوبة</th>
              <th className="px-3 py-2 text-right">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {report.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-sm text-gray-400">جميع الأصناف ضمن الحد الآمن</td></tr>
            ) : (
              report.map((item) => {
                const needed = item.reorderLevel * 2 - item.quantity;
                const status = item.quantity <= 0 ? "نفد" : "منخفض";
                const statusColor = item.quantity <= 0 ? "text-red-500 bg-red-500/10" : "text-amber-500 bg-amber-500/10";
                return (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-1.5 text-sm text-gray-300">{item.name}</td>
                    <td className="px-3 py-1.5 text-sm text-gray-400">{item.sku}</td>
                    <td className="px-3 py-1.5 text-sm text-gray-400">{item.warehouse}</td>
                    <td className={`px-3 py-1.5 text-left text-sm font-bold ${item.quantity <= 0 ? "text-red-400" : "text-amber-400"}`} dir="ltr">{item.quantity}</td>
                    <td className="px-3 py-1.5 text-left text-sm text-white" dir="ltr">{item.reorderLevel}</td>
                    <td className="px-3 py-1.5 text-left text-sm font-bold text-green-400" dir="ltr">{Math.max(0, needed)}</td>
                    <td className="px-3 py-1.5 text-right"><span className={`rounded px-2 py-0.5 text-xs ${statusColor}`}>{status}</span></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

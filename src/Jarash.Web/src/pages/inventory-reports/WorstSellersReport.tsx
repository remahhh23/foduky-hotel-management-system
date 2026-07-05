import { useState, useEffect, useMemo } from "react";
import { inventoryItemService, inventoryMovementService } from "./inventoryService";

export function WorstSellersReport() {
  const [items, setItems] = useState<ReturnType<typeof inventoryItemService.getAll>>([]);
  const [movements, setMovements] = useState<ReturnType<typeof inventoryMovementService.getAll>>([]);

  useEffect(() => {
    setItems(inventoryItemService.getAll());
    setMovements(inventoryMovementService.getAll());
  }, []);

  const report = useMemo(() => {
    const outboundTypes = ["sale_out", "return_out", "adjustment_out", "transfer_out", "damage"];

    return items
      .map((item) => {
        const outbound = movements.filter((m) => m.itemId === item.id && outboundTypes.includes(m.type));
        const totalOut = outbound.reduce((s, m) => s + m.quantity, 0);
        return { ...item, totalOut };
      })
      .filter((r) => r.quantity > 0)
      .sort((a, b) => a.totalOut - b.totalOut)
      .slice(0, 20);
  }, [items, movements]);

  const maxQty = items.length > 0 ? Math.max(...items.map((i) => i.quantity), 1) : 1;

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-rose-400">الأصناف الأقل مبيعًا</h2>
      <p className="mb-4 text-sm text-gray-400">أقل 20 صنفًا من حيث كمية الصادر (لديها رصيد)</p>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">#</th>
              <th className="px-3 py-2 text-right">الصنف</th>
              <th className="px-3 py-2 text-right">التصنيف</th>
              <th className="px-3 py-2 text-left">كمية الصادر</th>
              <th className="px-3 py-2 text-left">الرصيد الحالي</th>
              <th className="px-3 py-2 text-left">القيمة المخزنة</th>
            </tr>
          </thead>
          <tbody>
            {report.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-400">لا توجد نتائج</td></tr>
            ) : (
              report.map((r, idx) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-1.5 text-sm text-gray-400">{idx + 1}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-300">{r.name}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-400">{r.category}</td>
                  <td className="px-3 py-1.5 text-left text-sm font-bold text-rose-400" dir="ltr">{r.totalOut}</td>
                  <td className="px-3 py-1.5 text-left text-sm text-white" dir="ltr">{r.quantity}</td>
                  <td className="px-3 py-1.5 text-left text-sm text-green-400" dir="ltr">{(r.quantity * r.unitCost).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

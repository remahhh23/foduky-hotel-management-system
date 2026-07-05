import { useState, useEffect, useMemo } from "react";
import { inventoryItemService, inventoryMovementService } from "./inventoryService";

export function BestSellersReport() {
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
      .filter((r) => r.totalOut > 0)
      .sort((a, b) => b.totalOut - a.totalOut)
      .slice(0, 20);
  }, [items, movements]);

  const maxQty = report.length > 0 ? report[0].totalOut : 1;

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-green-400">الأصناف الأكثر مبيعًا</h2>
      <p className="mb-4 text-sm text-gray-400">أكثر 20 صنفًا من حيث كمية الصادر</p>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">#</th>
              <th className="px-3 py-2 text-right">الصنف</th>
              <th className="px-3 py-2 text-right">التصنيف</th>
              <th className="px-3 py-2 text-left">كمية الصادر</th>
              <th className="px-3 py-2 text-left">الرصيد الحالي</th>
              <th className="px-3 py-2 text-left">المؤشر</th>
            </tr>
          </thead>
          <tbody>
            {report.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-400">لا توجد مبيعات</td></tr>
            ) : (
              report.map((r, idx) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-1.5 text-sm text-gray-400">{idx + 1}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-300">{r.name}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-400">{r.category}</td>
                  <td className="px-3 py-1.5 text-left text-sm font-bold text-green-400" dir="ltr">{r.totalOut}</td>
                  <td className="px-3 py-1.5 text-left text-sm text-white" dir="ltr">{r.quantity}</td>
                  <td className="px-3 py-1.5 text-left">
                    <div className="h-2 w-full rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-green-500" style={{ width: `${(r.totalOut / maxQty) * 100}%` }} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

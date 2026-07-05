import { useState, useEffect, useMemo } from "react";
import { inventoryItemService, inventoryMovementService } from "./inventoryService";

export function SlowMovingReport() {
  const [items, setItems] = useState<ReturnType<typeof inventoryItemService.getAll>>([]);
  const [movements, setMovements] = useState<ReturnType<typeof inventoryMovementService.getAll>>([]);

  useEffect(() => {
    setItems(inventoryItemService.getAll());
    setMovements(inventoryMovementService.getAll());
  }, []);

  const report = useMemo(() => {
    const now = Date.now();
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    return items
      .filter((i) => i.quantity > 0)
      .map((item) => {
        const itemMovements = movements.filter((m) => m.itemId === item.id);
        const lastMovement = itemMovements.length > 0
          ? itemMovements.sort((a, b) => b.date.localeCompare(a.date))[0].date
          : "—";

        const daysSince = lastMovement !== "—"
          ? Math.floor((now - new Date(lastMovement).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        const mov90 = itemMovements.filter((m) => m.date >= ninetyDaysAgo).reduce((s, m) => s + m.quantity, 0);
        const mov60 = itemMovements.filter((m) => m.date >= sixtyDaysAgo).reduce((s, m) => s + m.quantity, 0);
        const mov30 = itemMovements.filter((m) => m.date >= thirtyDaysAgo).reduce((s, m) => s + m.quantity, 0);

        return { ...item, lastMovement, daysSince, mov90, mov60, mov30 };
      })
      .filter((r) => r.daysSince >= 60)
      .sort((a, b) => b.daysSince - a.daysSince);
  }, [items, movements]);

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-amber-400">الأصناف الراكدة</h2>
      <p className="mb-4 text-sm text-gray-400">الأصناف التي لم يحدث لها حركة لمدة 60 يومًا أو أكثر</p>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">الصنف</th>
              <th className="px-3 py-2 text-left">الكمية</th>
              <th className="px-3 py-2 text-left">آخر حركة</th>
              <th className="px-3 py-2 text-left">أيام منذ آخر حركة</th>
              <th className="px-3 py-2 text-left">حركة 90 يوم</th>
              <th className="px-3 py-2 text-left">حركة 60 يوم</th>
              <th className="px-3 py-2 text-left">حركة 30 يوم</th>
              <th className="px-3 py-2 text-left">القيمة</th>
            </tr>
          </thead>
          <tbody>
            {report.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-4 text-center text-sm text-gray-400">لا توجد أصناف راكدة</td></tr>
            ) : (
              report.map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-1.5 text-sm text-gray-300">{r.name}</td>
                  <td className="px-3 py-1.5 text-left text-sm text-white" dir="ltr">{r.quantity}</td>
                  <td className="px-3 py-1.5 text-left text-sm text-gray-400">{r.lastMovement}</td>
                  <td className="px-3 py-1.5 text-left text-sm font-bold text-red-400">{r.daysSince}</td>
                  <td className="px-3 py-1.5 text-left text-sm text-gray-400" dir="ltr">{r.mov90}</td>
                  <td className="px-3 py-1.5 text-left text-sm text-gray-400" dir="ltr">{r.mov60}</td>
                  <td className="px-3 py-1.5 text-left text-sm text-gray-400" dir="ltr">{r.mov30}</td>
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

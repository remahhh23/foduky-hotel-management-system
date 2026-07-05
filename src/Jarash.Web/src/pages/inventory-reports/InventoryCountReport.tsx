import { useState, useEffect } from "react";
import { inventoryCountService } from "./inventoryService";
import type { InventoryCount } from "./inventoryTypes";

export function InventoryCountReport() {
  const [counts, setCounts] = useState<InventoryCount[]>([]);

  useEffect(() => {
    setCounts(inventoryCountService.getAll());
  }, []);

  const withDiff = counts.filter((c) => c.difference !== 0);
  const totalExpected = counts.reduce((s, c) => s + c.expectedQty, 0);
  const totalActual = counts.reduce((s, c) => s + c.actualQty, 0);
  const totalDiff = counts.reduce((s, c) => s + c.difference, 0);

  const grouped = counts.reduce((acc, c) => {
    if (!acc[c.date]) acc[c.date] = [];
    acc[c.date].push(c);
    return acc;
  }, {} as Record<string, InventoryCount[]>);

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-teal-400">تقرير الجرد</h2>

      <div className="mb-4 grid grid-cols-4 gap-4">
        <div className="rounded bg-white/5 p-3 text-center">
          <div className="text-xs text-gray-400">عدد الجردات</div>
          <div className="text-lg font-bold text-white">{counts.length}</div>
        </div>
        <div className="rounded bg-blue-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">الكمية المتوقعة</div>
          <div className="text-lg font-bold text-blue-400" dir="ltr">{totalExpected.toLocaleString("en-US")}</div>
        </div>
        <div className="rounded bg-green-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">الكمية الفعلية</div>
          <div className="text-lg font-bold text-green-400" dir="ltr">{totalActual.toLocaleString("en-US")}</div>
        </div>
        <div className={`rounded p-3 text-center ${totalDiff !== 0 ? "bg-red-500/10" : "bg-white/5"}`}>
          <div className="text-xs text-gray-400">الفروقات</div>
          <div className={`text-lg font-bold ${totalDiff !== 0 ? "text-red-400" : "text-green-400"}`} dir="ltr">{totalDiff.toLocaleString("en-US")}</div>
        </div>
      </div>

      {withDiff.length > 0 && (
        <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 p-3">
          <span className="text-sm font-bold text-red-400">تنبيه: </span>
          <span className="text-sm text-gray-300">هناك {withDiff.length} صنف لديه فروقات في الجرد</span>
        </div>
      )}

      {Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])).map(([date, items]) => (
        <div key={date} className="mb-4 rounded border border-white/10">
          <div className="flex items-center justify-between bg-white/5 px-4 py-2">
            <span className="text-sm font-bold text-white">جرد تاريخ: {date}</span>
            <span className="text-sm text-gray-400">{items.length} أصناف</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-xs text-gray-400">
                <th className="px-3 py-2 text-right">الصنف</th>
                <th className="px-3 py-2 text-right">المستودع</th>
                <th className="px-3 py-2 text-left">متوقع</th>
                <th className="px-3 py-2 text-left">فعلي</th>
                <th className="px-3 py-2 text-left">الفرق</th>
                <th className="px-3 py-2 text-right">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-1.5 text-sm text-gray-300">{c.itemName}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-400">{c.warehouse}</td>
                  <td className="px-3 py-1.5 text-left text-sm text-gray-300" dir="ltr">{c.expectedQty}</td>
                  <td className="px-3 py-1.5 text-left text-sm text-gray-300" dir="ltr">{c.actualQty}</td>
                  <td className={`px-3 py-1.5 text-left text-sm font-bold ${c.difference === 0 ? "text-green-400" : "text-red-400"}`} dir="ltr">{c.difference > 0 ? "+" : ""}{c.difference}</td>
                  <td className="px-3 py-1.5 text-sm text-gray-400">{c.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {counts.length === 0 && (
        <div className="py-8 text-center text-sm text-gray-400">لا توجد جردات مسجلة</div>
      )}
    </div>
  );
}

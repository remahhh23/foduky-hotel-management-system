import { useState, useEffect, useMemo } from "react";
import { inventoryTransferService } from "./inventoryService";
import type { InventoryTransfer } from "./inventoryTypes";

export function TransfersReport() {
  const [transfers, setTransfers] = useState<InventoryTransfer[]>([]);

  useEffect(() => {
    setTransfers(inventoryTransferService.getAll());
  }, []);

  const totalQty = transfers.reduce((s, t) => s + t.quantity, 0);

  const grouped = useMemo(() => {
    const map = new Map<string, InventoryTransfer[]>();
    for (const t of transfers) {
      const key = t.date;
      const list = map.get(key) || [];
      list.push(t);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [transfers]);

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-cyan-400">تقرير التحويلات</h2>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="rounded bg-white/5 p-3 text-center">
          <div className="text-xs text-gray-400">عدد التحويلات</div>
          <div className="text-lg font-bold text-white">{transfers.length}</div>
        </div>
        <div className="rounded bg-blue-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">إجمالي الكمية المحولة</div>
          <div className="text-lg font-bold text-blue-400" dir="ltr">{totalQty.toLocaleString("en-US")}</div>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">لا توجد تحويلات</div>
      ) : (
        grouped.map(([date, items]) => (
          <div key={date} className="mb-4 rounded border border-white/10">
            <div className="flex items-center justify-between bg-white/5 px-4 py-2">
              <span className="text-sm font-bold text-white">{date}</span>
              <span className="text-sm text-gray-400">{items.length} تحويلات</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-xs text-gray-400">
                  <th className="px-3 py-2 text-right">الصنف</th>
                  <th className="px-3 py-2 text-left">الكمية</th>
                  <th className="px-3 py-2 text-right">من</th>
                  <th className="px-3 py-2 text-right">إلى</th>
                  <th className="px-3 py-2 text-right">المرجع</th>
                  <th className="px-3 py-2 text-right">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-1.5 text-sm text-gray-300">{t.itemName}</td>
                    <td className="px-3 py-1.5 text-left text-sm font-bold text-white" dir="ltr">{t.quantity}</td>
                    <td className="px-3 py-1.5 text-sm text-amber-400">{t.fromWarehouse}</td>
                    <td className="px-3 py-1.5 text-sm text-green-400">{t.toWarehouse}</td>
                    <td className="px-3 py-1.5 text-sm text-gray-400">{t.reference || "—"}</td>
                    <td className="px-3 py-1.5 text-sm text-gray-400">{t.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}

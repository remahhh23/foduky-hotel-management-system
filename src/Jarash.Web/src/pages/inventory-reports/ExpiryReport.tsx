import { useState, useEffect, useMemo } from "react";
import { inventoryItemService } from "./inventoryService";
import type { InventoryItem } from "./inventoryTypes";

export function ExpiryReport() {
  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    setItems(inventoryItemService.getAll());
  }, []);

  const report = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    return items
      .filter((i) => i.expiryDate && i.quantity > 0)
      .map((item) => {
        const daysToExpiry = Math.floor((new Date(item.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { ...item, daysToExpiry };
      })
      .filter((r) => r.daysToExpiry <= 90)
      .sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  }, [items]);

  const expired = report.filter((r) => r.daysToExpiry <= 0);
  const expiringSoon = report.filter((r) => r.daysToExpiry > 0 && r.daysToExpiry <= 30);
  const expiringLater = report.filter((r) => r.daysToExpiry > 30 && r.daysToExpiry <= 90);

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-rose-400">انتهاء الصلاحية</h2>

      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="rounded bg-red-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">منتهية الصلاحية</div>
          <div className="text-lg font-bold text-red-400">{expired.length}</div>
        </div>
        <div className="rounded bg-amber-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">تنتهي خلال 30 يوم</div>
          <div className="text-lg font-bold text-amber-400">{expiringSoon.length}</div>
        </div>
        <div className="rounded bg-blue-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">تنتهي خلال 90 يوم</div>
          <div className="text-lg font-bold text-blue-400">{expiringLater.length}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">الصنف</th>
              <th className="px-3 py-2 text-right">تاريخ الانتهاء</th>
              <th className="px-3 py-2 text-left">الأيام المتبقية</th>
              <th className="px-3 py-2 text-left">الكمية</th>
              <th className="px-3 py-2 text-left">القيمة</th>
              <th className="px-3 py-2 text-right">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {report.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-400">لا توجد أصناف قريبة من انتهاء الصلاحية</td></tr>
            ) : (
              report.map((r) => {
                const status = r.daysToExpiry <= 0 ? "منتهي" : r.daysToExpiry <= 30 ? "ينتهي قريبًا" : "سينتهي";
                const statusColor = r.daysToExpiry <= 0 ? "text-red-500 bg-red-500/10" : r.daysToExpiry <= 30 ? "text-amber-500 bg-amber-500/10" : "text-blue-500 bg-blue-500/10";
                return (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-1.5 text-sm text-gray-300">{r.name}</td>
                    <td className="px-3 py-1.5 text-sm text-gray-400">{r.expiryDate}</td>
                    <td className={`px-3 py-1.5 text-left text-sm font-bold ${r.daysToExpiry <= 0 ? "text-red-400" : r.daysToExpiry <= 30 ? "text-amber-400" : "text-gray-300"}`}>{r.daysToExpiry <= 0 ? "—" : r.daysToExpiry}</td>
                    <td className="px-3 py-1.5 text-left text-sm text-white" dir="ltr">{r.quantity}</td>
                    <td className="px-3 py-1.5 text-left text-sm text-green-400" dir="ltr">{(r.quantity * r.unitCost).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
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

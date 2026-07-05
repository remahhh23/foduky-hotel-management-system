import { useState, useEffect, useMemo } from "react";
import { inventoryItemService } from "./inventoryService";

export function InventoryCostReport() {
  const [items, setItems] = useState<ReturnType<typeof inventoryItemService.getAll>>([]);

  useEffect(() => {
    setItems(inventoryItemService.getAll());
  }, []);

  const report = useMemo(() => {
    const withStock = items.filter((i) => i.quantity > 0);
    const totalCost = withStock.reduce((s, i) => s + i.quantity * i.unitCost, 0);
    const totalPrice = withStock.reduce((s, i) => s + i.quantity * i.sellingPrice, 0);

    const byCategory = new Map<string, { qty: number; cost: number; price: number }>();
    for (const item of withStock) {
      const prev = byCategory.get(item.category) || { qty: 0, cost: 0, price: 0 };
      prev.qty += item.quantity;
      prev.cost += item.quantity * item.unitCost;
      prev.price += item.quantity * item.sellingPrice;
      byCategory.set(item.category, prev);
    }

    const sorted = withStock.sort((a, b) => (b.quantity * b.unitCost) - (a.quantity * a.unitCost));

    return { items: sorted, totalCost, totalPrice, profit: totalPrice - totalCost, byCategory, count: withStock.length };
  }, [items]);

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-teal-400">تكلفة المخزون</h2>

      <div className="mb-4 grid grid-cols-4 gap-4">
        <div className="rounded bg-white/5 p-3 text-center">
          <div className="text-xs text-gray-400">عدد الأصناف</div>
          <div className="text-lg font-bold text-white">{report.count}</div>
        </div>
        <div className="rounded bg-amber-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">التكلفة الإجمالية</div>
          <div className="text-lg font-bold text-amber-400" dir="ltr">{report.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded bg-green-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">سعر البيع الإجمالي</div>
          <div className="text-lg font-bold text-green-400" dir="ltr">{report.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded bg-blue-500/10 p-3 text-center">
          <div className="text-xs text-gray-400">الربح المتوقع</div>
          <div className="text-lg font-bold text-blue-400" dir="ltr">{report.profit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="mb-4 rounded-lg bg-white/5 p-3">
        <h3 className="mb-2 text-sm font-bold text-white">التكلفة حسب التصنيف</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">التصنيف</th>
              <th className="px-3 py-2 text-left">الكمية</th>
              <th className="px-3 py-2 text-left">التكلفة</th>
              <th className="px-3 py-2 text-left">سعر البيع</th>
              <th className="px-3 py-2 text-left">الربح</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(report.byCategory.entries()).map(([cat, data]) => (
              <tr key={cat} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-3 py-1.5 text-sm text-gray-300">{cat}</td>
                <td className="px-3 py-1.5 text-left text-sm text-white" dir="ltr">{data.qty}</td>
                <td className="px-3 py-1.5 text-left text-sm text-amber-400" dir="ltr">{data.cost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                <td className="px-3 py-1.5 text-left text-sm text-green-400" dir="ltr">{data.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                <td className="px-3 py-1.5 text-left text-sm font-bold text-blue-400" dir="ltr">{(data.price - data.cost).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto">
        <h3 className="mb-2 text-sm font-bold text-white">تفاصيل الأصناف</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-3 py-2 text-right">الصنف</th>
              <th className="px-3 py-2 text-left">الكمية</th>
              <th className="px-3 py-2 text-left">تكلفة الوحدة</th>
              <th className="px-3 py-2 text-left">سعر البيع</th>
              <th className="px-3 py-2 text-left">إجمالي التكلفة</th>
              <th className="px-3 py-2 text-left">إجمالي البيع</th>
              <th className="px-3 py-2 text-left">الربح</th>
            </tr>
          </thead>
          <tbody>
            {report.items.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-sm text-gray-400">لا توجد أصناف</td></tr>
            ) : (
              report.items.map((item) => {
                const itemCost = item.quantity * item.unitCost;
                const itemPrice = item.quantity * item.sellingPrice;
                const itemProfit = itemPrice - itemCost;
                return (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-1.5 text-sm text-gray-300">{item.name}</td>
                    <td className="px-3 py-1.5 text-left text-sm text-white" dir="ltr">{item.quantity}</td>
                    <td className="px-3 py-1.5 text-left text-sm text-gray-400" dir="ltr">{item.unitCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-1.5 text-left text-sm text-gray-400" dir="ltr">{item.sellingPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-1.5 text-left text-sm text-amber-400" dir="ltr">{itemCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-1.5 text-left text-sm text-green-400" dir="ltr">{itemPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className={`px-3 py-1.5 text-left text-sm font-bold ${itemProfit >= 0 ? "text-blue-400" : "text-red-400"}`} dir="ltr">{itemProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
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

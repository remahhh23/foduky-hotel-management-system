import { useState, useEffect, useCallback, Fragment } from "react";
import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { purchaseOrderService } from "./purchasesService";
import { PURCHASE_ORDER_STATUS_LABELS, PURCHASE_ORDER_STATUS_COLORS } from "./purchasesTypes";
import type { PurchaseOrder } from "./purchasesTypes";

export default function PurchaseOrdersList({ onBack }: { onBack: () => void }) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(() => {
    const all = purchaseOrderService.getAll();
    setOrders(filter === "all" ? all : all.filter((o) => o.status === filter));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
          <h3 className="text-lg font-bold text-white">متابعة أوامر الشراء</h3>
        </div>
        <button onClick={() => window.print()} className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-slate-400 hover:bg-white/5 transition-colors flex items-center gap-1" title="طباعة">
          <Printer className="h-4 w-4" />
        </button>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-white/20 px-3 py-1.5 text-sm outline-none focus:border-sky-500">
          <option value="all">الكل</option>
          <option value="pending">معلق</option>
          <option value="approved">معتمد</option>
          <option value="completed">مكتمل</option>
          <option value="cancelled">ملغي</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-slate-400">رقم الأمر</th>
              <th className="px-4 py-3 text-right font-medium text-slate-400">المورد</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">التاريخ</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">عدد الأصناف</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">الإجمالي</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">الحالة</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">لا توجد أوامر شراء</td></tr>
            )}
            {orders.map((o) => (
              <Fragment key={o.id}>
                <tr className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>
                  <td className="px-4 py-3 font-medium text-white">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-slate-400">{o.supplierName}</td>
                  <td className="px-4 py-3 text-center text-slate-400">{o.date}</td>
                  <td className="px-4 py-3 text-center text-slate-400">{o.items.length}</td>
                  <td className="px-4 py-3 text-center text-white font-medium">{o.totalAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", PURCHASE_ORDER_STATUS_COLORS[o.status])}>
                      {PURCHASE_ORDER_STATUS_LABELS[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-400 text-xs">{expandedId === o.id ? "▲" : "▼"}</td>
                </tr>
                {expandedId === o.id && (
                  <tr key={`${o.id}_items`}>
                    <td colSpan={7} className="bg-white/5 px-6 py-3">
                      <div className="text-xs font-medium text-slate-500 mb-2">الأصناف:</div>
                      {o.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 text-sm py-1">
                          <span className="flex-1 text-slate-300">{item.itemName}</span>
                          <span className="w-20 text-center text-slate-500">الكمية: {item.quantity}</span>
                          <span className="w-24 text-center text-slate-500">سعر: {item.unitPrice.toLocaleString()}</span>
                          <span className="w-24 text-center font-medium text-sky-600">{item.totalPrice.toLocaleString()}</span>
                        </div>
                      ))}
                      {o.notes && <div className="mt-2 text-xs text-slate-400">ملاحظات: {o.notes}</div>}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

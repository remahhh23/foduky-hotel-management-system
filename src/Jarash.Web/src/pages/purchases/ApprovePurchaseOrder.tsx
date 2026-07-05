import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { purchaseOrderService } from "./purchasesService";
import { PURCHASE_ORDER_STATUS_LABELS, PURCHASE_ORDER_STATUS_COLORS } from "./purchasesTypes";
import type { PurchaseOrder } from "./purchasesTypes";

export default function ApprovePurchaseOrder({ onBack }: { onBack: () => void }) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);

  const load = useCallback(() => {
    setOrders(purchaseOrderService.getByStatus("pending"));
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleApprove(id: string) {
    if (!confirm("تأكيد اعتماد أمر الشراء؟")) return;
    purchaseOrderService.approve(id);
    logger.info("ApprovePurchaseOrder: approved", { id });
    load();
  }

  function handleCancel(id: string) {
    if (!confirm("تأكيد إلغاء أمر الشراء؟")) return;
    purchaseOrderService.cancel(id);
    logger.info("ApprovePurchaseOrder: cancelled", { id });
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">اعتماد أوامر الشراء</h3>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-slate-400">رقم الأمر</th>
              <th className="px-4 py-3 text-right font-medium text-slate-400">المورد</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">التاريخ</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">الإجمالي</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">الحالة</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400 w-28"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">لا توجد أوامر شراء معلقة</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{o.orderNumber}</td>
                <td className="px-4 py-3 text-slate-400">{o.supplierName}</td>
                <td className="px-4 py-3 text-center text-slate-400">{o.date}</td>
                <td className="px-4 py-3 text-center text-white font-medium">{o.totalAmount.toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", PURCHASE_ORDER_STATUS_COLORS[o.status])}>
                    {PURCHASE_ORDER_STATUS_LABELS[o.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-1">
                    <Button size="sm" onClick={() => handleApprove(o.id)}>
                      <CheckCircle className="h-4 w-4 ml-1" /> اعتماد
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleCancel(o.id)}>
                      <XCircle className="h-4 w-4 ml-1" /> إلغاء
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

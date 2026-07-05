import { useState, useEffect } from "react";
import { reportsService } from "./reportsService";
import type { AgingBucket } from "./reportsTypes";

export function AccountsPayableReport() {
  const [buckets, setBuckets] = useState<AgingBucket[]>([]);

  useEffect(() => {
    setBuckets(reportsService.getAccountsPayable());
  }, []);

  const grandTotal = buckets.reduce((s, b) => s + b.total, 0);

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <h2 className="mb-4 text-lg font-bold text-teal-400">الذمم الدائنة</h2>
      <p className="mb-4 text-sm text-gray-400">فواتير المشتريات غير المسددة للموردين</p>

      <div className="grid grid-cols-4 gap-4">
        {buckets.map((bucket) => (
          <div key={bucket.label} className="rounded bg-white/5 p-3">
            <h3 className="mb-2 text-sm font-semibold text-red-400">{bucket.label}</h3>
            <div className="mb-2 text-lg font-bold text-white" dir="ltr">
              {bucket.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            {bucket.items.length === 0 ? (
              <div className="text-xs text-gray-400">لا توجد فواتير</div>
            ) : (
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {bucket.items.map((item, i) => (
                  <div key={i} className="rounded bg-white/5 p-2 text-xs">
                    <div className="text-white">{item.name}</div>
                    <div className="flex justify-between text-gray-400">
                      <span>{item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                      <span>{item.reference}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded border border-teal-500/30 bg-teal-500/10 p-3 text-center text-sm text-teal-300">
        إجمالي الذمم الدائنة: {grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </div>
    </div>
  );
}

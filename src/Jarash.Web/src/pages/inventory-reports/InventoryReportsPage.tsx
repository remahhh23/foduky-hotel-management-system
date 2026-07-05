import { useState } from "react";
import { CurrentStockReport } from "./CurrentStockReport";
import { ItemMovementsReport } from "./ItemMovementsReport";
import { SlowMovingReport } from "./SlowMovingReport";
import { BestSellersReport } from "./BestSellersReport";
import { WorstSellersReport } from "./WorstSellersReport";
import { ExpiryReport } from "./ExpiryReport";
import { ReorderReport } from "./ReorderReport";
import { InventoryCountReport } from "./InventoryCountReport";
import { TransfersReport } from "./TransfersReport";
import { InventoryCostReport } from "./InventoryCostReport";

const TABS = [
  { id: "current-stock", label: "المخزون الحالي" },
  { id: "movements", label: "حركة الأصناف" },
  { id: "slow-moving", label: "الأصناف الراكدة" },
  { id: "best-sellers", label: "الأكثر مبيعًا" },
  { id: "worst-sellers", label: "الأقل مبيعًا" },
  { id: "expiry", label: "انتهاء الصلاحية" },
  { id: "reorder", label: "حد إعادة الطلب" },
  { id: "count", label: "تقرير الجرد" },
  { id: "transfers", label: "تقرير التحويلات" },
  { id: "cost", label: "تكلفة المخزون" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function InventoryReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("current-stock");

  const renderTab = () => {
    switch (activeTab) {
      case "current-stock": return <CurrentStockReport />;
      case "movements": return <ItemMovementsReport />;
      case "slow-moving": return <SlowMovingReport />;
      case "best-sellers": return <BestSellersReport />;
      case "worst-sellers": return <WorstSellersReport />;
      case "expiry": return <ExpiryReport />;
      case "reorder": return <ReorderReport />;
      case "count": return <InventoryCountReport />;
      case "transfers": return <TransfersReport />;
      case "cost": return <InventoryCostReport />;
      default: return <CurrentStockReport />;
    }
  };

  return (
    <div className="flex h-full flex-col p-4" dir="rtl">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-xl font-bold text-white">تقارير المخازن</h1>
      </div>

      <div className="mb-4 flex flex-wrap gap-1 rounded-lg bg-white/5 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded px-3 py-1.5 text-sm transition ${
              activeTab === tab.id
                ? "bg-teal-600 text-white"
                : "text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">{renderTab()}</div>
    </div>
  );
}

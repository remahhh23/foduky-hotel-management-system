import { useState } from "react";
import { FundMovementsReport } from "./FundMovementsReport";
import { FundStatementReport } from "./FundStatementReport";
import { ReceiptsReport } from "./ReceiptsReport";
import { PaymentsReport } from "./PaymentsReport";
import { ExchangeReport } from "./ExchangeReport";
import { BalancesReport } from "./BalancesReport";
import { DailyClosingReport } from "./DailyClosingReport";

const TABS = [
  { id: "movements", label: "حركة الصندوق" },
  { id: "statement", label: "كشف الصندوق" },
  { id: "receipts", label: "عمليات القبض" },
  { id: "payments", label: "عمليات الدفع" },
  { id: "exchange", label: "عمليات الصرف" },
  { id: "balances", label: "رصيد الصندوق" },
  { id: "daily-closing", label: "تقرير الإغلاق اليومي" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function FundReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("movements");

  const renderTab = () => {
    switch (activeTab) {
      case "movements": return <FundMovementsReport />;
      case "statement": return <FundStatementReport />;
      case "receipts": return <ReceiptsReport />;
      case "payments": return <PaymentsReport />;
      case "exchange": return <ExchangeReport />;
      case "balances": return <BalancesReport />;
      case "daily-closing": return <DailyClosingReport />;
      default: return <FundMovementsReport />;
    }
  };

  return (
    <div className="flex h-full flex-col p-4" dir="rtl">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-xl font-bold text-white">التقارير الصندوقية</h1>
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

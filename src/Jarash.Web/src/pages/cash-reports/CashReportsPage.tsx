import { useState } from "react";
import { DailyReceipts } from "./DailyReceipts";
import { DailyPayments } from "./DailyPayments";
import { CashInReport } from "./CashInReport";
import { CashOutReport } from "./CashOutReport";
import { TreasuryMovements } from "./TreasuryMovements";
import { FundBalancesReport } from "./FundBalancesReport";
import { CashFlowSummary } from "./CashFlowSummary";

const TABS = [
  { id: "daily-receipts", label: "المقبوضات اليومية" },
  { id: "daily-payments", label: "المدفوعات اليومية" },
  { id: "cash-in", label: "النقد الداخل" },
  { id: "cash-out", label: "النقد الخارج" },
  { id: "treasury", label: "حركة الخزينة" },
  { id: "balances", label: "أرصدة الصناديق" },
  { id: "cash-flow", label: "ملخص التدفقات النقدية" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function CashReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("daily-receipts");

  const renderTab = () => {
    switch (activeTab) {
      case "daily-receipts": return <DailyReceipts />;
      case "daily-payments": return <DailyPayments />;
      case "cash-in": return <CashInReport />;
      case "cash-out": return <CashOutReport />;
      case "treasury": return <TreasuryMovements />;
      case "balances": return <FundBalancesReport />;
      case "cash-flow": return <CashFlowSummary />;
      default: return <DailyReceipts />;
    }
  };

  return (
    <div className="flex h-full flex-col p-4" dir="rtl">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-xl font-bold text-white">التقارير النقدية</h1>
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

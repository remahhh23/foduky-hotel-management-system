import { useState } from "react";
import { BalanceSheetReport } from "./BalanceSheetReport";
import { IncomeStatementReport } from "./IncomeStatementReport";
import { TrialBalanceReport } from "./TrialBalanceReport";
import { GeneralLedgerReport } from "./GeneralLedgerReport";
import { GeneralJournalReport } from "./GeneralJournalReport";
import { AccountMovementsReport } from "./AccountMovementsReport";
import { AccountsReceivableReport } from "./AccountsReceivableReport";
import { AccountsPayableReport } from "./AccountsPayableReport";
import { CashFlowReport } from "./CashFlowReport";

const TABS = [
  { id: "balance-sheet", label: "الميزانية العمومية" },
  { id: "income-statement", label: "قائمة الدخل" },
  { id: "trial-balance", label: "ميزان المراجعة" },
  { id: "general-ledger", label: "دفتر الأستاذ" },
  { id: "general-journal", label: "اليومية العامة" },
  { id: "account-movements", label: "حركة الحسابات" },
  { id: "ar", label: "الذمم المدينة" },
  { id: "ap", label: "الذمم الدائنة" },
  { id: "cash-flow", label: "التدفقات النقدية" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function FinancialReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("balance-sheet");

  const renderTab = () => {
    switch (activeTab) {
      case "balance-sheet": return <BalanceSheetReport />;
      case "income-statement": return <IncomeStatementReport />;
      case "trial-balance": return <TrialBalanceReport />;
      case "general-ledger": return <GeneralLedgerReport />;
      case "general-journal": return <GeneralJournalReport />;
      case "account-movements": return <AccountMovementsReport />;
      case "ar": return <AccountsReceivableReport />;
      case "ap": return <AccountsPayableReport />;
      case "cash-flow": return <CashFlowReport />;
      default: return <BalanceSheetReport />;
    }
  };

  return (
    <div className="flex h-full flex-col p-4" dir="rtl">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-xl font-bold text-white">التقارير المالية</h1>
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

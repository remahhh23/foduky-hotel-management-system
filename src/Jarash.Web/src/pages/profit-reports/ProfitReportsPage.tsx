import { useState } from "react";
import { SalesProfitReport } from "./SalesProfitReport";
import { ProfitMarginReport } from "./ProfitMarginReport";
import { ProfitByItemReport } from "./ProfitByItemReport";
import { ProfitByCustomerReport } from "./ProfitByCustomerReport";
import { ProfitBySupplierReport } from "./ProfitBySupplierReport";
import { ProfitByEmployeeReport } from "./ProfitByEmployeeReport";
import { ProfitByPeriodReport } from "./ProfitByPeriodReport";
import { MonthlyComparisonReport } from "./MonthlyComparisonReport";
import { CostAnalysisReport } from "./CostAnalysisReport";

const TABS = [
  { id: "sales-profit", label: "أرباح المبيعات" },
  { id: "profit-margin", label: "هامش الربح" },
  { id: "by-item", label: "حسب الصنف" },
  { id: "by-customer", label: "حسب العميل" },
  { id: "by-supplier", label: "حسب المورد" },
  { id: "by-employee", label: "حسب الموظف" },
  { id: "by-period", label: "حسب الفترة" },
  { id: "monthly", label: "مقارنة شهرية" },
  { id: "cost-analysis", label: "تحليل التكلفة" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ProfitReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("sales-profit");

  const renderTab = () => {
    switch (activeTab) {
      case "sales-profit": return <SalesProfitReport />;
      case "profit-margin": return <ProfitMarginReport />;
      case "by-item": return <ProfitByItemReport />;
      case "by-customer": return <ProfitByCustomerReport />;
      case "by-supplier": return <ProfitBySupplierReport />;
      case "by-employee": return <ProfitByEmployeeReport />;
      case "by-period": return <ProfitByPeriodReport />;
      case "monthly": return <MonthlyComparisonReport />;
      case "cost-analysis": return <CostAnalysisReport />;
      default: return <SalesProfitReport />;
    }
  };

  return (
    <div className="flex h-full flex-col p-4" dir="rtl">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-xl font-bold text-white">تقارير الأرباح</h1>
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

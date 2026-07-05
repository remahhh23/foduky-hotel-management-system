import { useState } from "react";
import {
  BookOpen,
  Users,
  Truck,
  GitBranch,
  FileSpreadsheet,
  PlusCircle,
  Search,
  UserPlus,
  UserCog,
  Settings,
  List,
  FileEdit,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import ChartOfAccounts from "./ChartOfAccounts";
import CustomersPage from "./CustomersPage";
import CustomerStatement from "./CustomerStatement";
import SupplierAccounts from "./SupplierAccounts";
import CostCentersPage from "./CostCentersPage";
import NewJournalEntry from "./NewJournalEntry";
import EditJournalEntry from "./EditJournalEntry";
import PostJournalEntries from "./PostJournalEntries";

interface SubItem {
  title: string;
  description: string;
  icon: React.ElementType;
  key: string;
}

interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
  items: SubItem[];
}

const tabs: Tab[] = [
  {
    id: "chart",
    label: "دليل الحسابات",
    icon: BookOpen,
    items: [
      { title: "شجرة الحسابات", description: "عرض دليل الحسابات بالشجرة المحاسبية", icon: Search, key: "tree" },
      { title: "إدارة الحسابات", description: "إضافة وتعديل وحذف الحسابات", icon: PlusCircle, key: "manage" },
    ],
  },
  {
    id: "customers",
    label: "العملاء",
    icon: Users,
    items: [
      { title: "إدارة العملاء", description: "إضافة وتعديل وحذف بيانات العملاء", icon: UserPlus, key: "manage" },
      { title: "كشف حساب عميل", description: "عرض حركات ورصيد العميل", icon: Search, key: "statement" },
    ],
  },
  {
    id: "suppliers",
    label: "الموردون",
    icon: Truck,
    items: [
      { title: "حسابات الموردين", description: "إدارة الحسابات المالية للموردين", icon: UserCog, key: "manage" },
    ],
  },
  {
    id: "costcenters",
    label: "مراكز التكلفة",
    icon: GitBranch,
    items: [
      { title: "إدارة المراكز", description: "إنشاء وتعديل مراكز التكلفة", icon: Settings, key: "manage" },
    ],
  },
  {
    id: "entries",
    label: "القيود",
    icon: FileSpreadsheet,
    items: [
      { title: "قيد يومية", description: "إنشاء قيد يومية جديد", icon: PlusCircle, key: "new" },
      { title: "تعديل قيد", description: "تعديل القيود المسودة", icon: FileEdit, key: "edit" },
      { title: "ترحيل القيود", description: "ترحيل القيود إلى الأستاذ", icon: CheckSquare, key: "post" },
    ],
  },
];

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [chartSubPage, setChartSubPage] = useState<string | null>(null);
  const [customerSubPage, setCustomerSubPage] = useState<string | null>(null);
  const [supplierSubPage, setSupplierSubPage] = useState<string | null>(null);
  const [costCenterSubPage, setCostCenterSubPage] = useState<string | null>(null);
  const [entrySubPage, setEntrySubPage] = useState<string | null>(null);
  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  function handleTabChange(tabId: string) {
    logger.info("AccountsPage: tab changed", { from: activeTab, to: tabId });
    setActiveTab(tabId);
    setChartSubPage(null);
    setCustomerSubPage(null);
    setSupplierSubPage(null);
    setCostCenterSubPage(null);
    setEntrySubPage(null);
  }

  const handleBack = () => {
    logger.info("AccountsPage: back to overview");
    setChartSubPage(null);
    setCustomerSubPage(null);
    setSupplierSubPage(null);
    setCostCenterSubPage(null);
    setEntrySubPage(null);
  };

  if (activeTab === "chart" && chartSubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">الحسابات</h2>
          <p className="mt-1 text-sm text-slate-500">إدارة دليل الحسابات والعملاء ومراكز التكلفة</p>
        </div>
        <div className="flex-1 overflow-auto">{chartSubPage === "tree" ? <ChartOfAccounts onBack={handleBack} treeMode /> : <ChartOfAccounts onBack={handleBack} />}</div>
      </div>
    );
  }

  if (activeTab === "customers" && customerSubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">الحسابات</h2>
          <p className="mt-1 text-sm text-slate-500">إدارة دليل الحسابات والعملاء ومراكز التكلفة</p>
        </div>
        <div className="flex-1 overflow-auto">{customerSubPage === "statement" ? <CustomerStatement onBack={handleBack} /> : <CustomersPage onBack={handleBack} />}</div>
      </div>
    );
  }

  if (activeTab === "suppliers" && supplierSubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">الحسابات</h2>
          <p className="mt-1 text-sm text-slate-500">إدارة دليل الحسابات والعملاء ومراكز التكلفة</p>
        </div>
        <div className="flex-1 overflow-auto"><SupplierAccounts onBack={handleBack} /></div>
      </div>
    );
  }

  if (activeTab === "costcenters" && costCenterSubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">الحسابات</h2>
          <p className="mt-1 text-sm text-slate-500">إدارة دليل الحسابات والعملاء ومراكز التكلفة</p>
        </div>
        <div className="flex-1 overflow-auto"><CostCentersPage onBack={handleBack} /></div>
      </div>
    );
  }

  if (activeTab === "entries" && entrySubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">الحسابات</h2>
          <p className="mt-1 text-sm text-slate-500">إدارة دليل الحسابات والعملاء ومراكز التكلفة</p>
        </div>
        <div className="flex-1 overflow-auto">
          {entrySubPage === "new" && <NewJournalEntry onBack={handleBack} />}
          {entrySubPage === "edit" && <EditJournalEntry onBack={handleBack} />}
          {entrySubPage === "post" && <PostJournalEntries onBack={handleBack} />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">الحسابات</h2>
        <p className="mt-1 text-sm text-slate-500">إدارة دليل الحسابات والعملاء ومراكز التكلفة</p>
      </div>

      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)}
              className={cn("flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative", isActive ? "text-sky-600" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50")}>
              <TabIcon className="h-4 w-4" /><span>{tab.label}</span>
              {isActive && <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-sky-500 rounded-full" />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {currentTab.items.map((item) => {
            const ItemIcon = item.icon;
            return (
              <button key={item.title} onClick={() => {
                logger.info("AccountsPage: navigate", { tab: activeTab, subPage: item.key });
                if (activeTab === "chart") setChartSubPage(item.key);
                else if (activeTab === "customers") setCustomerSubPage(item.key);
                else if (activeTab === "suppliers") setSupplierSubPage(item.key);
                else if (activeTab === "costcenters") setCostCenterSubPage(item.key);
                else if (activeTab === "entries") setEntrySubPage(item.key);
              }}
                className="group flex flex-col items-center gap-4 rounded-2xl bg-card-bg p-6 text-white shadow-md transition-all hover:shadow-sky-500/10 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 transition-transform group-hover:scale-110">
                  <ItemIcon className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold">{item.title}</h3>
                  <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

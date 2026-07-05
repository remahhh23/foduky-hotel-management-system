import { useState } from "react";
import {
  Package,
  TrendingUp,
  ClipboardList,
  Warehouse,
  PlusCircle,
  Search,
  ArrowUpFromLine,
  ArrowDownToLine,
  ArrowLeftRight,
  RotateCcw,
  ClipboardCheck,
  Scale,
  Settings,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import ItemsManagement from "./ItemsManagement";
import CategoriesManagement from "./CategoriesManagement";
import StockMovementPage from "./StockMovementPage";
import StockTransfers from "./StockTransfers";
import StockCounting from "./StockCounting";
import WarehousesManagement from "./WarehousesManagement";

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
    id: "items",
    label: "الأصناف",
    icon: Package,
    items: [
      { title: "إدارة الأصناف", description: "إضافة وتعديل وحذف الأصناف والباركود والأسعار", icon: PlusCircle, key: "manage" },
      { title: "تصنيفات الأصناف", description: "إدارة تصنيفات الأصناف", icon: Search, key: "categories" },
    ],
  },
  {
    id: "movements",
    label: "حركة المخزون",
    icon: TrendingUp,
    items: [
      { title: "إدخال مخزني", description: "إضافة كمية واردة للمخزون", icon: ArrowDownToLine, key: "stock-in" },
      { title: "إخراج مخزني", description: "صرف كمية من المخزون", icon: ArrowUpFromLine, key: "stock-out" },
      { title: "تحويل بين المخازن", description: "تحويل أصناف بين المخازن", icon: ArrowLeftRight, key: "transfer" },
      { title: "إرجاع أصناف", description: "إرجاع أصناف إلى المخزون", icon: RotateCcw, key: "return" },
    ],
  },
  {
    id: "counting",
    label: "الجرد",
    icon: ClipboardList,
    items: [
      { title: "جرد المخزون", description: "تسجيل الجرد الفعلي للمخزون", icon: ClipboardCheck, key: "count" },
      { title: "تسويات الجرد", description: "تسوية الفروقات بين الرصيد الدفتري والفعلي", icon: Scale, key: "adjust" },
    ],
  },
  {
    id: "warehouses",
    label: "المخازن",
    icon: Warehouse,
    items: [
      { title: "إدارة المخازن", description: "إضافة وتعديل وحذف المخازن", icon: Settings, key: "manage" },
    ],
  },
];

function ListIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" />
    </svg>
  );
}

export default function WarehousesPage() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [itemSubPage, setItemSubPage] = useState<string | null>(null);
  const [movementSubPage, setMovementSubPage] = useState<string | null>(null);
  const [countingSubPage, setCountingSubPage] = useState<string | null>(null);
  const [warehouseSubPage, setWarehouseSubPage] = useState<string | null>(null);
  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  function handleTabChange(tabId: string) {
    logger.info("WarehousesPage: tab changed", { from: activeTab, to: tabId });
    setActiveTab(tabId);
    setItemSubPage(null);
    setMovementSubPage(null);
    setCountingSubPage(null);
    setWarehouseSubPage(null);
  }

  const handleBack = () => {
    logger.info("WarehousesPage: back to overview");
    setItemSubPage(null);
    setMovementSubPage(null);
    setCountingSubPage(null);
    setWarehouseSubPage(null);
  };

  if (activeTab === "items" && itemSubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">المخازن</h2>
          <p className="mt-1 text-sm text-slate-500">إدارة المخزون والمستودعات بالكامل</p>
        </div>
        <div className="flex-1 overflow-auto">
          {itemSubPage === "manage" && <ItemsManagement onBack={handleBack} />}
          {itemSubPage === "categories" && <CategoriesManagement onBack={handleBack} />}
        </div>
      </div>
    );
  }

  if (activeTab === "movements" && movementSubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">المخازن</h2>
          <p className="mt-1 text-sm text-slate-500">إدارة المخزون والمستودعات بالكامل</p>
        </div>
        <div className="flex-1 overflow-auto">
          <StockMovementPage onBack={handleBack} mode={movementSubPage as "stock-in" | "stock-out" | "return"} />
        </div>
      </div>
    );
  }

  if (activeTab === "movements" && movementSubPage === "transfer") {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">المخازن</h2>
          <p className="mt-1 text-sm text-slate-500">إدارة المخزون والمستودعات بالكامل</p>
        </div>
        <div className="flex-1 overflow-auto"><StockTransfers onBack={handleBack} /></div>
      </div>
    );
  }

  if (activeTab === "counting" && countingSubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">المخازن</h2>
          <p className="mt-1 text-sm text-slate-500">إدارة المخزون والمستودعات بالكامل</p>
        </div>
        <div className="flex-1 overflow-auto"><StockCounting onBack={handleBack} mode={countingSubPage as "count" | "adjust"} /></div>
      </div>
    );
  }

  if (activeTab === "warehouses" && warehouseSubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">المخازن</h2>
          <p className="mt-1 text-sm text-slate-500">إدارة المخزون والمستودعات بالكامل</p>
        </div>
        <div className="flex-1 overflow-auto"><WarehousesManagement onBack={handleBack} /></div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">المخازن</h2>
        <p className="mt-1 text-sm text-slate-500">إدارة المخزون والمستودعات بالكامل</p>
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
                logger.info("WarehousesPage: navigate to sub-page", { tab: activeTab, subPage: item.key });
                if (activeTab === "items") setItemSubPage(item.key);
                else if (activeTab === "movements") setMovementSubPage(item.key);
                else if (activeTab === "counting") setCountingSubPage(item.key);
                else if (activeTab === "warehouses") setWarehouseSubPage(item.key);
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

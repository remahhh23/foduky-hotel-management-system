import { useState } from "react";
import {
  Banknote,
  FileText,
  ArrowLeftRight,
  PlusCircle,
  XCircle,
  ClipboardList,
  ArrowUpFromLine,
  ArrowDownToLine,
  Send,
  Receipt,
  Scale,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import FundOpen from "./FundOpen";
import FundClose from "./FundClose";
import FundBalances from "./FundBalances";
import VoucherPage from "./VoucherPage";
import FundTransfer from "./FundTransfer";
import FundStatement from "./FundStatement";

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
    id: "funds",
    label: "الصناديق",
    icon: Banknote,
    items: [
      { title: "فتح الصندوق", description: "فتح صندوق جديد وتحديد الرصيد الافتتاحي", icon: PlusCircle, key: "open" },
      { title: "إغلاق الصندوق", description: "إغلاق الصندوق اليومي وجرد النقدية", icon: XCircle, key: "close" },
      { title: "أرصدة الصناديق", description: "عرض أرصدة جميع الصناديق", icon: Balance, key: "balances" },
    ],
  },
  {
    id: "vouchers",
    label: "السندات",
    icon: FileText,
    items: [
      { title: "سند قبض", description: "تسجيل سند قبض نقدية", icon: ArrowDownToLine, key: "receipt" },
      { title: "سند دفع", description: "تسجيل سند دفع لمورد", icon: ArrowUpFromLine, key: "payment" },
      { title: "سند صرف", description: "تسجيل سند صرف نقدية", icon: Send, key: "exchange" },
      { title: "سند استلام", description: "تسجيل سند استلام نقدية", icon: Receipt, key: "receiving" },
    ],
  },
  {
    id: "movements",
    label: "الحركة",
    icon: ArrowLeftRight,
    items: [
      { title: "تحويل بين الصناديق", description: "تحويل نقدية من صندوق لآخر", icon: Scale, key: "transfer" },
      { title: "كشف حركة الصندوق", description: "عرض حركات وتفاصيل الصندوق", icon: List, key: "statement" },
    ],
  },
];

function Balance(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

export default function CashPage() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [fundSubPage, setFundSubPage] = useState<string | null>(null);
  const [voucherSubPage, setVoucherSubPage] = useState<string | null>(null);
  const [movementSubPage, setMovementSubPage] = useState<string | null>(null);
  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  function handleTabChange(tabId: string) {
    logger.info("CashPage: tab changed", { from: activeTab, to: tabId });
    setActiveTab(tabId);
    setFundSubPage(null);
    setVoucherSubPage(null);
    setMovementSubPage(null);
  }

  const handleBack = () => {
    logger.info("CashPage: back to overview");
    setFundSubPage(null);
    setVoucherSubPage(null);
    setMovementSubPage(null);
  };

  if (activeTab === "funds" && fundSubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">النقد</h2>
          <p className="mt-1 text-sm text-slate-500">إدارة العمليات النقدية اليومية</p>
        </div>
        <div className="flex-1 overflow-auto">
          {fundSubPage === "open" && <FundOpen onBack={handleBack} />}
          {fundSubPage === "close" && <FundClose onBack={handleBack} />}
          {fundSubPage === "balances" && <FundBalances onBack={handleBack} />}
        </div>
      </div>
    );
  }

  if (activeTab === "vouchers" && voucherSubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">النقد</h2>
          <p className="mt-1 text-sm text-slate-500">إدارة العمليات النقدية اليومية</p>
        </div>
        <div className="flex-1 overflow-auto">
          <VoucherPage onBack={handleBack} voucherType={voucherSubPage as "receipt" | "payment" | "exchange" | "receiving"} />
        </div>
      </div>
    );
  }

  if (activeTab === "movements" && movementSubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">النقد</h2>
          <p className="mt-1 text-sm text-slate-500">إدارة العمليات النقدية اليومية</p>
        </div>
        <div className="flex-1 overflow-auto">
          {movementSubPage === "transfer" && <FundTransfer onBack={handleBack} />}
          {movementSubPage === "statement" && <FundStatement onBack={handleBack} />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">النقد</h2>
        <p className="mt-1 text-sm text-slate-500">إدارة العمليات النقدية اليومية</p>
      </div>

      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative",
                isActive
                  ? "text-sky-600"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <TabIcon className="h-4 w-4" />
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-sky-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {currentTab.items.map((item) => {
            const ItemIcon = item.icon;
            return (
              <button
                key={item.title}
                onClick={() => {
                  logger.info("CashPage: navigate to sub-page", { tab: activeTab, subPage: item.key });
                  if (activeTab === "funds") setFundSubPage(item.key);
                  else if (activeTab === "vouchers") setVoucherSubPage(item.key);
                  else if (activeTab === "movements") setMovementSubPage(item.key);
                }}
                className="group flex flex-col items-center gap-4 rounded-2xl bg-card-bg p-6 text-white shadow-md transition-all hover:shadow-sky-500/10 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
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

import { useState } from "react";
import {
  Truck,
  FileText,
  Receipt,
  DollarSign,
  PlusCircle,
  Edit3,
  ClipboardList,
  CheckCircle,
  List,
  RotateCcw,
  Banknote,
  FileSpreadsheet,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import SuppliersPage from "./SuppliersPage";
import SupplierStatement from "./SupplierStatement";
import NewPurchaseOrder from "./NewPurchaseOrder";
import ApprovePurchaseOrder from "./ApprovePurchaseOrder";
import PurchaseOrdersList from "./PurchaseOrdersList";
import NewPurchaseInvoice from "./NewPurchaseInvoice";
import EditPurchaseInvoice from "./EditPurchaseInvoice";
import PurchaseReturn from "./PurchaseReturn";
import SupplierPayments from "./SupplierPayments";
import PaymentVouchers from "./PaymentVouchers";
import AccountSettlement from "./AccountSettlement";

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
    id: "suppliers",
    label: "الموردون",
    icon: Truck,
    items: [
      { title: "إدارة الموردين", description: "إضافة وتعديل وحذف بيانات الموردين", icon: PlusCircle, key: "manage" },
      { title: "كشف حساب المورد", description: "عرض حركات ومديونية المورد", icon: ClipboardList, key: "statement" },
    ],
  },
  {
    id: "orders",
    label: "أوامر الشراء",
    icon: FileText,
    items: [
      { title: "إنشاء أمر شراء", description: "إضافة أمر شراء جديد", icon: PlusCircle, key: "new" },
      { title: "اعتماد أمر شراء", description: "اعتماد أوامر الشراء المعلقة", icon: CheckCircle, key: "approve" },
      { title: "متابعة الأوامر", description: "عرض ومتابعة أوامر الشراء", icon: List, key: "list" },
    ],
  },
  {
    id: "invoices",
    label: "فواتير الشراء",
    icon: Receipt,
    items: [
      { title: "فاتورة شراء", description: "تسجيل فاتورة شراء جديدة", icon: PlusCircle, key: "new" },
      { title: "تعديل فاتورة", description: "تعديل فواتير الشراء", icon: Edit3, key: "edit" },
      { title: "مرتجع شراء", description: "تسجيل مرتجع شراء", icon: RotateCcw, key: "return" },
    ],
  },
  {
    id: "payments",
    label: "المدفوعات",
    icon: DollarSign,
    items: [
      { title: "دفعات الموردين", description: "تسديد دفعات للموردين", icon: Banknote, key: "supplier" },
      { title: "سندات الصرف", description: "إدارة سندات الصرف", icon: FileSpreadsheet, key: "voucher" },
      { title: "تسوية الحسابات", description: "تسوية حسابات الموردين", icon: Scale, key: "settlement" },
    ],
  },
];

export default function PurchasesPage() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [supplierSubPage, setSupplierSubPage] = useState<string | null>(null);
  const [orderSubPage, setOrderSubPage] = useState<string | null>(null);
  const [invoiceSubPage, setInvoiceSubPage] = useState<string | null>(null);
  const [paymentSubPage, setPaymentSubPage] = useState<string | null>(null);
  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  function handleTabChange(tabId: string) {
    logger.info("PurchasesPage: tab changed", { from: activeTab, to: tabId });
    setActiveTab(tabId);
    setSupplierSubPage(null);
    setOrderSubPage(null);
    setInvoiceSubPage(null);
    setPaymentSubPage(null);
  }

  const handleBack = () => {
    logger.info("PurchasesPage: back to overview");
    setSupplierSubPage(null);
    setOrderSubPage(null);
    setInvoiceSubPage(null);
    setPaymentSubPage(null);
  };

  /* ── Suppliers sub-page ── */
  if (activeTab === "suppliers" && supplierSubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">المشتريات</h2>
          <p className="mt-1 text-sm text-slate-500">إدارة المشتريات والموردين وأوامر الشراء</p>
        </div>
        <div className="flex-1 overflow-auto">
          {supplierSubPage === "manage" && <SuppliersPage onBack={handleBack} />}
          {supplierSubPage === "statement" && <SupplierStatement onBack={handleBack} />}
        </div>
      </div>
    );
  }

  /* ── Orders sub-page ── */
  if (activeTab === "orders" && orderSubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">المشتريات</h2>
          <p className="mt-1 text-sm text-slate-500">إدارة المشتريات والموردين وأوامر الشراء</p>
        </div>
        <div className="flex-1 overflow-auto">
          {orderSubPage === "new" && <NewPurchaseOrder onBack={handleBack} />}
          {orderSubPage === "approve" && <ApprovePurchaseOrder onBack={handleBack} />}
          {orderSubPage === "list" && <PurchaseOrdersList onBack={handleBack} />}
        </div>
      </div>
    );
  }

  /* ── Invoices sub-page ── */
  if (activeTab === "invoices" && invoiceSubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">المشتريات</h2>
          <p className="mt-1 text-sm text-slate-500">إدارة المشتريات والموردين وأوامر الشراء</p>
        </div>
        <div className="flex-1 overflow-auto">
          {invoiceSubPage === "new" && <NewPurchaseInvoice onBack={handleBack} />}
          {invoiceSubPage === "edit" && <EditPurchaseInvoice onBack={handleBack} />}
          {invoiceSubPage === "return" && <PurchaseReturn onBack={handleBack} />}
        </div>
      </div>
    );
  }

  /* ── Payments sub-page ── */
  if (activeTab === "payments" && paymentSubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">المشتريات</h2>
          <p className="mt-1 text-sm text-slate-500">إدارة المشتريات والموردين وأوامر الشراء</p>
        </div>
        <div className="flex-1 overflow-auto">
          {paymentSubPage === "supplier" && <SupplierPayments onBack={handleBack} />}
          {paymentSubPage === "voucher" && <PaymentVouchers onBack={handleBack} />}
          {paymentSubPage === "settlement" && <AccountSettlement onBack={handleBack} />}
        </div>
      </div>
    );
  }

  /* ── Main tab view ── */
  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">المشتريات</h2>
        <p className="mt-1 text-sm text-slate-500">إدارة المشتريات والموردين وأوامر الشراء</p>
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
        {currentTab.items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {currentTab.items.map((item) => {
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.title}
                  onClick={() => {
                    logger.info("PurchasesPage: navigate to sub-page", { tab: activeTab, subPage: item.key });
                    if (activeTab === "suppliers") setSupplierSubPage(item.key);
                    else if (activeTab === "orders") setOrderSubPage(item.key);
                    else if (activeTab === "invoices") setInvoiceSubPage(item.key);
                    else if (activeTab === "payments") setPaymentSubPage(item.key);
                  }}
                  className="group flex flex-col items-center gap-4 rounded-2xl bg-card-bg p-6 text-white shadow-md transition-all hover:shadow-sky-500/10 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 transition-transform group-hover:scale-110">
                    <ItemIcon className="h-8 w-8" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-bold">{item.title}</h3>
                    <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-400">هذا القسم قيد التطوير</p>
          </div>
        )}
      </div>
    </div>
  );
}

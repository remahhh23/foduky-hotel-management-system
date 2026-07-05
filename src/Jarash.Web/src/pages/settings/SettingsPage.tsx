import { useState } from "react";
import {
  Building2,
  Users,
  Shield,
  Receipt,
  Percent,
  Coins,
  HardDrive,
  Monitor,
  Settings2,
  Globe,
  Printer,
  Scan,
  FileText,
  UserCog,
  BedDouble,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import CompanySettings from "./CompanySettings";
import UserManagement from "./UserManagement";
import InvoiceSettings from "./InvoiceSettings";
import CurrencySettings from "./CurrencySettings";
import BackupSettings from "./BackupSettings";
import DeviceSettings from "./DeviceSettings";
import SystemSettings from "./SystemSettings";
import HotelSettings from "./HotelSettings";

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
    id: "company",
    label: "الشركة",
    icon: Building2,
    items: [
      { title: "بيانات الشركة", description: "اسم الشركة، الشعار، العنوان، الهاتف، الرقم الضريبي", icon: FileText, key: "info" },
    ],
  },
  {
    id: "users",
    label: "المستخدمون",
    icon: Users,
    items: [
      { title: "إدارة المستخدمين", description: "إضافة وتعديل وإيقاف المستخدمين", icon: UserCog, key: "manage" },
      { title: "الصلاحيات", description: "إنشاء مجموعات صلاحيات وتحديد صلاحيات المستخدمين", icon: Shield, key: "permissions" },
    ],
  },
  {
    id: "invoices",
    label: "الفواتير",
    icon: Receipt,
    items: [
      { title: "إعدادات الفواتير", description: "تنسيق الفواتير وترقيمها وإعدادات الطابعات", icon: Printer, key: "format" },
      { title: "الضرائب", description: "نسب وأنواع الضرائب", icon: Percent, key: "taxes" },
    ],
  },
  {
    id: "currencies",
    label: "العملات",
    icon: Coins,
    items: [
      { title: "إدارة العملات", description: "إضافة العملات وأسعار الصرف", icon: Globe, key: "manage" },
    ],
  },
  {
    id: "hotel",
    label: "الفندق",
    icon: BedDouble,
    items: [
      { title: "الصندوق النقدي للفندق", description: "تحديد الصندوق النقدي الذي تذهب إليه إيرادات الفندق", icon: Coins, key: "fund" },
    ],
  },
  {
    id: "backup",
    label: "النسخ الاحتياطي",
    icon: HardDrive,
    items: [
      { title: "النسخ الاحتياطي", description: "إنشاء واستعادة النسخ الاحتياطية", icon: HardDrive, key: "manage" },
    ],
  },
  {
    id: "devices",
    label: "الأجهزة",
    icon: Monitor,
    items: [
      { title: "إعدادات الأجهزة", description: "قارئ الباركود، درج النقد، الطابعة", icon: Scan, key: "manage" },
    ],
  },
  {
    id: "system",
    label: "النظام",
    icon: Settings2,
    items: [
      { title: "إعدادات النظام", description: "اللغة، التاريخ، سجل الأحداث، صيانة قاعدة البيانات", icon: Globe, key: "manage" },
    ],
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [companySubPage, setCompanySubPage] = useState<string | null>(null);
  const [userSubPage, setUserSubPage] = useState<string | null>(null);
  const [invoiceSubPage, setInvoiceSubPage] = useState<string | null>(null);
  const [currencySubPage, setCurrencySubPage] = useState<string | null>(null);
  const [hotelSubPage, setHotelSubPage] = useState<string | null>(null);
  const [backupSubPage, setBackupSubPage] = useState<string | null>(null);
  const [deviceSubPage, setDeviceSubPage] = useState<string | null>(null);
  const [systemSubPage, setSystemSubPage] = useState<string | null>(null);
  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  function handleTabChange(tabId: string) {
    logger.info("SettingsPage: tab changed", { from: activeTab, to: tabId });
    setActiveTab(tabId);
    setCompanySubPage(null);
    setUserSubPage(null);
    setInvoiceSubPage(null);
    setCurrencySubPage(null);
    setHotelSubPage(null);
    setBackupSubPage(null);
    setDeviceSubPage(null);
    setSystemSubPage(null);
  }

  const handleBack = () => {
    logger.info("SettingsPage: back to overview");
    setCompanySubPage(null);
    setUserSubPage(null);
    setInvoiceSubPage(null);
    setCurrencySubPage(null);
    setBackupSubPage(null);
    setDeviceSubPage(null);
    setSystemSubPage(null);
  };

  if (activeTab === "company" && companySubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">الإعدادات</h2>
          <p className="mt-1 text-sm text-slate-500">إعدادات النظام والمستخدمين والصلاحيات</p>
        </div>
        <div className="flex-1 overflow-auto"><CompanySettings onBack={handleBack} /></div>
      </div>
    );
  }

  if (activeTab === "users" && userSubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">الإعدادات</h2>
          <p className="mt-1 text-sm text-slate-500">إعدادات النظام والمستخدمين والصلاحيات</p>
        </div>
        <div className="flex-1 overflow-auto">
          {userSubPage === "manage" && <UserManagement onBack={handleBack} />}
        </div>
      </div>
    );
  }

  if (activeTab === "invoices" && invoiceSubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">الإعدادات</h2>
          <p className="mt-1 text-sm text-slate-500">إعدادات النظام والمستخدمين والصلاحيات</p>
        </div>
        <div className="flex-1 overflow-auto"><InvoiceSettings onBack={handleBack} /></div>
      </div>
    );
  }

  if (activeTab === "currencies" && currencySubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">الإعدادات</h2>
          <p className="mt-1 text-sm text-slate-500">إعدادات النظام والمستخدمين والصلاحيات</p>
        </div>
        <div className="flex-1 overflow-auto"><CurrencySettings onBack={handleBack} /></div>
      </div>
    );
  }

  if (activeTab === "hotel" && hotelSubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">الإعدادات</h2>
          <p className="mt-1 text-sm text-slate-500">إعدادات النظام والمستخدمين والصلاحيات</p>
        </div>
        <div className="flex-1 overflow-auto"><HotelSettings onBack={handleBack} /></div>
      </div>
    );
  }

  if (activeTab === "backup" && backupSubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">الإعدادات</h2>
          <p className="mt-1 text-sm text-slate-500">إعدادات النظام والمستخدمين والصلاحيات</p>
        </div>
        <div className="flex-1 overflow-auto"><BackupSettings onBack={handleBack} /></div>
      </div>
    );
  }

  if (activeTab === "devices" && deviceSubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">الإعدادات</h2>
          <p className="mt-1 text-sm text-slate-500">إعدادات النظام والمستخدمين والصلاحيات</p>
        </div>
        <div className="flex-1 overflow-auto"><DeviceSettings onBack={handleBack} /></div>
      </div>
    );
  }

  if (activeTab === "system" && systemSubPage) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">الإعدادات</h2>
          <p className="mt-1 text-sm text-slate-500">إعدادات النظام والمستخدمين والصلاحيات</p>
        </div>
        <div className="flex-1 overflow-auto"><SystemSettings onBack={handleBack} /></div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">الإعدادات</h2>
        <p className="mt-1 text-sm text-slate-500">إعدادات النظام والمستخدمين والصلاحيات</p>
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
                logger.info("SettingsPage: navigate to sub-page", { tab: activeTab, subPage: item.key });
                if (activeTab === "company") setCompanySubPage(item.key);
                else if (activeTab === "users") setUserSubPage(item.key);
                else if (activeTab === "invoices") setInvoiceSubPage(item.key);
                else if (activeTab === "currencies") setCurrencySubPage(item.key);
                else if (activeTab === "hotel") setHotelSubPage(item.key);
                else if (activeTab === "backup") setBackupSubPage(item.key);
                else if (activeTab === "devices") setDeviceSubPage(item.key);
                else if (activeTab === "system") setSystemSubPage(item.key);
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

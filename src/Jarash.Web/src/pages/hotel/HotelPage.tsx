import { useState } from "react";
import {
  DoorOpen,
  CalendarCheck,
  ConciergeBell,
  Receipt,
  CalendarPlus,
  Edit3,
  XCircle,
  Clock,
  Bell,
  Shirt,
  UtensilsCrossed,
  PlusCircle,
  Calculator,
  ArrowUpFromLine,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import RoomTypes from "./RoomTypes";
import DefineRoom from "./DefineRoom";
import RoomPrices from "./RoomPrices";
import NewReservation from "./NewReservation";
import EditReservation from "./EditReservation";
import CancelReservation from "./CancelReservation";
import ExtendStay from "./ExtendStay";
import RoomGrid from "./RoomGrid";
import RoomDetail from "./RoomDetail";
import ServiceRequestPage from "./ServiceRequestPage";
import GuestInvoicePage from "./GuestInvoicePage";
import ExpensesPage from "./ExpensesPage";
import PaymentPage from "./PaymentPage";

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
    id: "rooms",
    label: "الغرف",
    icon: DoorOpen,
    items: [
      { title: "لوحة الغرف", description: "عرض جميع الغرف وحالتها", icon: DoorOpen, key: "grid" },
      { title: "تعريف الغرف", description: "إضافة غرفة جديدة وتحديد مواصفاتها", icon: CalendarPlus, key: "define" },
      { title: "أنواع الغرف", description: "إدارة تصنيفات وأنواع الغرف", icon: List, key: "types" },
      { title: "أسعار الغرف", description: "تحديد أسعار الغرف حسب الموسم", icon: DollarSign, key: "prices" },
    ],
  },
  {
    id: "reservations",
    label: "الحجز",
    icon: CalendarCheck,
    items: [
      { title: "حجز جديد", description: "إنشاء حجز جديد لنزيل", icon: CalendarPlus, key: "new" },
      { title: "تعديل الحجز", description: "تعديل بيانات الحجز القائم", icon: Edit3, key: "edit" },
      { title: "إلغاء الحجز", description: "إلغاء حجز مؤكد", icon: XCircle, key: "cancel" },
      { title: "تمديد الإقامة", description: "تمديد مدة إقامة النزيل", icon: Clock, key: "extend" },
    ],
  },
  {
    id: "services",
    label: "الخدمات",
    icon: ConciergeBell,
    items: [
      { title: "خدمة الغرف", description: "إدارة طلبات خدمة الغرف", icon: Bell, key: "room-service" },
      { title: "المغسلة", description: "إدارة طلبات التنظيف والغسيل", icon: Shirt, key: "laundry" },
      { title: "المطعم", description: "إدارة طلبات الطعام والمشروبات", icon: UtensilsCrossed, key: "restaurant" },
      { title: "الخدمات الإضافية", description: "خدمات إضافية للنزلاء", icon: PlusCircle, key: "additional" },
    ],
  },
  {
    id: "invoices",
    label: "الفواتير",
    icon: Receipt,
    items: [
      { title: "حساب إقامة النزيل", description: "احتساب تكاليف الإقامة والخدمات", icon: Calculator, key: "guest-invoice" },
      { title: "المصروفات", description: "تسجيل مصروفات الغرفة والنزيل", icon: ArrowUpFromLine, key: "expenses" },
      { title: "السداد", description: "تسديد فواتير الإقامة", icon: CheckCircle, key: "payment" },
    ],
  },
];

function List(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" />
    </svg>
  );
}

function DollarSign(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

export default function HotelPage() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [roomSubPage, setRoomSubPage] = useState<string | null>(null);
  const [reservationSubPage, setReservationSubPage] = useState<string | null>(null);
  const [serviceSubPage, setServiceSubPage] = useState<string | null>(null);
  const [invoiceSubPage, setInvoiceSubPage] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  function handleTabChange(tabId: string) {
    logger.info("HotelPage: tab changed", { from: activeTab, to: tabId });
    setActiveTab(tabId);
    setRoomSubPage(null);
    setReservationSubPage(null);
    setServiceSubPage(null);
    setInvoiceSubPage(null);
    setSelectedRoomId(null);
    setSelectedReservationId(null);
  }

  const handleBack = () => {
    logger.info("HotelPage: back to overview");
    setRoomSubPage(null);
    setReservationSubPage(null);
    setServiceSubPage(null);
    setInvoiceSubPage(null);
    setSelectedRoomId(null);
    setSelectedReservationId(null);
  };

  /* ── Rooms sub-page content ── */
  if (activeTab === "rooms" && roomSubPage) {
    return (
      <div className="flex h-full flex-col p-3 md:p-6">
        <div className="mb-3 md:mb-6">
          <h2 className="text-lg md:text-2xl font-bold text-slate-800">فندقي</h2>
          <p className="mt-0.5 md:mt-1 text-xs md:text-sm text-slate-500">إدارة المنشآت الفندقية والغرف والحجوزات</p>
        </div>
        <div className="flex-1 overflow-auto">
          {roomSubPage === "types" && <RoomTypes onBack={handleBack} />}
          {roomSubPage === "define" && <DefineRoom onBack={handleBack} />}
          {roomSubPage === "prices" && <RoomPrices onBack={handleBack} />}
          {roomSubPage === "grid" && (
            <RoomGrid
              onBack={handleBack}
              onNewReservation={(roomId) => {
                setSelectedRoomId(roomId);
                setActiveTab("reservations");
                setReservationSubPage("new");
              }}
              onRoomDetail={(roomId) => {
                setSelectedRoomId(roomId);
                setRoomSubPage("detail");
              }}
            />
          )}
          {roomSubPage === "detail" && selectedRoomId && (
            <RoomDetail
              onBack={handleBack}
              roomId={selectedRoomId}
              onEdit={(reservationId) => {
                setSelectedReservationId(reservationId);
                setActiveTab("reservations");
                setReservationSubPage("edit");
              }}
              onCancel={(reservationId) => {
                setSelectedReservationId(reservationId);
                setActiveTab("reservations");
                setReservationSubPage("cancel");
              }}
              onExtend={(reservationId) => {
                setSelectedReservationId(reservationId);
                setActiveTab("reservations");
                setReservationSubPage("extend");
              }}
              onCheckout={(reservationId) => {
                setSelectedReservationId(reservationId);
                setSelectedRoomId(null);
                setActiveTab("invoices");
                setInvoiceSubPage("guest-invoice");
              }}
            />
          )}
        </div>
      </div>
    );
  }

  /* ── Reservation sub-page content ── */
  if (activeTab === "reservations" && reservationSubPage) {
    return (
      <div className="flex h-full flex-col p-3 md:p-6">
        <div className="mb-3 md:mb-6">
          <h2 className="text-lg md:text-2xl font-bold text-slate-800">فندقي</h2>
          <p className="mt-0.5 md:mt-1 text-xs md:text-sm text-slate-500">إدارة المنشآت الفندقية والغرف والحجوزات</p>
        </div>
        <div className="flex-1 overflow-auto">
          {reservationSubPage === "new" && <NewReservation onBack={handleBack} selectedRoomId={selectedRoomId ?? undefined} />}
          {reservationSubPage === "edit" && <EditReservation onBack={handleBack} selectedReservationId={selectedReservationId ?? undefined} />}
          {reservationSubPage === "cancel" && <CancelReservation onBack={handleBack} selectedReservationId={selectedReservationId ?? undefined} />}
          {reservationSubPage === "extend" && <ExtendStay onBack={handleBack} selectedReservationId={selectedReservationId ?? undefined} />}
        </div>
      </div>
    );
  }

  /* ── Services sub-page content ── */
  if (activeTab === "services" && serviceSubPage) {
    return (
      <div className="flex h-full flex-col p-3 md:p-6">
        <div className="mb-3 md:mb-6">
          <h2 className="text-lg md:text-2xl font-bold text-slate-800">فندقي</h2>
          <p className="mt-0.5 md:mt-1 text-xs md:text-sm text-slate-500">إدارة المنشآت الفندقية والغرف والحجوزات</p>
        </div>
        <div className="flex-1 overflow-auto">
          <ServiceRequestPage onBack={handleBack} serviceType={serviceSubPage as "room-service" | "laundry" | "restaurant" | "additional"} />
        </div>
      </div>
    );
  }

  /* ── Invoices sub-page content ── */
  if (activeTab === "invoices" && invoiceSubPage) {
    return (
      <div className="flex h-full flex-col p-3 md:p-6">
        <div className="mb-3 md:mb-6">
          <h2 className="text-lg md:text-2xl font-bold text-slate-800">فندقي</h2>
          <p className="mt-0.5 md:mt-1 text-xs md:text-sm text-slate-500">إدارة المنشآت الفندقية والغرف والحجوزات</p>
        </div>
        <div className="flex-1 overflow-auto">
          {invoiceSubPage === "guest-invoice" && <GuestInvoicePage onBack={handleBack} selectedReservationId={selectedReservationId ?? undefined} />}
          {invoiceSubPage === "expenses" && <ExpensesPage onBack={handleBack} />}
          {invoiceSubPage === "payment" && <PaymentPage onBack={handleBack} />}
        </div>
      </div>
    );
  }

  /* ── Main tab view ── */
  return (
    <div className="flex h-full flex-col p-3 md:p-6">
      <div className="mb-3 md:mb-6">
        <h2 className="text-lg md:text-2xl font-bold text-slate-800">فندقي</h2>
        <p className="mt-0.5 md:mt-1 text-xs md:text-sm text-slate-500">إدارة المنشآت الفندقية والغرف والحجوزات</p>
      </div>

      <div className="mb-3 md:mb-6 flex gap-1 border-b border-slate-200 overflow-x-auto">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                  "flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-3 text-[11px] md:text-sm font-medium transition-colors relative whitespace-nowrap",
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {currentTab.items.map((item) => {
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.title}
                  onClick={() => {
                    if (activeTab === "rooms" && item.key) {
                      logger.info("HotelPage: navigate to room sub-page", { subPage: item.key });
                      setRoomSubPage(item.key);
                    } else if (activeTab === "reservations" && item.key) {
                      logger.info("HotelPage: navigate to reservation sub-page", { subPage: item.key });
                      setReservationSubPage(item.key);
                    } else if (activeTab === "services" && item.key) {
                      logger.info("HotelPage: navigate to service sub-page", { subPage: item.key });
                      setServiceSubPage(item.key);
                    } else if (activeTab === "invoices" && item.key) {
                      logger.info("HotelPage: navigate to invoice sub-page", { subPage: item.key });
                      setInvoiceSubPage(item.key);
                    }
                  }}
                  className="group flex flex-col items-center gap-2 md:gap-4 rounded-xl md:rounded-2xl bg-card-bg p-3 md:p-6 text-white shadow-md transition-all hover:shadow-sky-500/10 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  <div className="flex h-8 w-8 md:h-16 md:w-16 items-center justify-center rounded-lg md:rounded-2xl bg-sky-500/20 text-sky-400 transition-transform group-hover:scale-110">
                    <ItemIcon className="h-4 w-4 md:h-8 md:w-8" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-[11px] md:text-sm font-bold">{item.title}</h3>
                    <p className="mt-0.5 md:mt-1 text-[10px] md:text-[11px] text-slate-400 leading-relaxed hidden md:block">
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

import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  Warehouse,
  Hotel,
  ShoppingCart,
  Banknote,
  UserCircle,
  FileText,
  Wallet,
  DollarSign,
  Package,
  TrendingUp,
  Settings,
  User,
  Menu,
  ChevronRight,
  Fingerprint,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ElementType;
  accentColor: string;
}

const sidebarItems: SidebarItem[] = [
  { label: "اسم الشركة", path: "/about", icon: Building2, accentColor: "bg-teal-500" },
  { label: "المخازن", path: "/warehouses", icon: Warehouse, accentColor: "bg-amber-500" },
  { label: "فندقي", path: "/hotel", icon: Hotel, accentColor: "bg-sky-500" },
  { label: "الحضور", path: "/attendance", icon: Fingerprint, accentColor: "bg-purple-500" },
  { label: "شراء", path: "/purchases", icon: ShoppingCart, accentColor: "bg-orange-500" },
  { label: "النقد", path: "/cash", icon: Banknote, accentColor: "bg-green-500" },
  { label: "إضافة حساب", path: "/accounts", icon: UserCircle, accentColor: "bg-indigo-500" },
  { label: "تقارير مالية", path: "/financial-reports", icon: FileText, accentColor: "bg-violet-500" },
  { label: "التقارير الصندوقية", path: "/fund-reports", icon: Wallet, accentColor: "bg-cyan-500" },
  { label: "تقارير نقدية", path: "/cash-reports", icon: DollarSign, accentColor: "bg-emerald-500" },
  { label: "تقارير المخازن", path: "/inventory-reports", icon: Package, accentColor: "bg-lime-500" },
  { label: "تقارير الأرباح", path: "/profit-reports", icon: TrendingUp, accentColor: "bg-rose-500" },
  { label: "الإعدادات", path: "/settings", icon: Settings, accentColor: "bg-slate-400" },
];

export function RightSidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggle = useCallback(() => setCollapsed((prev) => !prev), []);

  const isActive = (path: string) => location.pathname === path;

  function handleNav(path: string) {
    navigate(path);
    setMobileOpen(false);
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-20 right-2 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg md:hidden"
        aria-label="فتح القائمة"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "flex flex-col bg-sidebar border-l border-slate-800/50 transition-all duration-200",
          "md:relative md:flex",
          collapsed ? "w-16" : "w-58",
          mobileOpen
            ? "fixed inset-y-0 right-0 z-50 w-64"
            : "hidden"
        )}
      >
        <div className="flex items-center justify-between p-3 border-b border-slate-800/50">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                A
              </div>
              <div>
                <p className="text-xs font-medium text-white leading-tight">Admin</p>
                <p className="text-[10px] text-teal-400 leading-tight">مدير النظام</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex w-full justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                A
              </div>
            </div>
          )}
          <button
            onClick={() => { if (mobileOpen) setMobileOpen(false); else toggle(); }}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-600 text-white hover:bg-teal-700 transition-colors"
            aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={cn(
                "relative flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors text-right",
                active
                  ? "bg-sidebar-hover text-white"
                  : "text-slate-400 hover:bg-sidebar-hover hover:text-slate-200"
              )}
              title={collapsed ? item.label : undefined}
            >
              <span
                className={cn(
                  "absolute right-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full transition-opacity",
                  item.accentColor,
                  active ? "opacity-100" : "opacity-0"
                )}
              />
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-800/50 p-3">
        {!collapsed && (
          <p className="text-center text-[10px] text-slate-500">فندقي © {new Date().getFullYear()}</p>
        )}
      </div>
    </aside>
    </>
  );
}

import { useLocation, useNavigate } from "react-router-dom";
import { Hotel, ShoppingCart, Banknote, Home, FileText, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileItems = [
  { label: "الرئيسية", path: "/", icon: Home },
  { label: "فندقي", path: "/hotel", icon: Hotel },
  { label: "شراء", path: "/purchases", icon: ShoppingCart },
  { label: "النقد", path: "/cash", icon: Banknote },
  { label: "التقارير", path: "/financial-reports", icon: FileText },
];

export function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 right-0 left-0 z-50 flex items-center justify-around border-t border-slate-700 bg-sidebar py-1 md:hidden">
      {mobileItems.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] transition-colors",
              active ? "text-teal-400" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
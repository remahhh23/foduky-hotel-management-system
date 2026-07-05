import { useState } from "react";
import {
  RefreshCw,
  Calculator,
  Printer,
  Camera,
  Keyboard,
  Wrench,
  Key,
  ScanLine,
  Monitor,
  HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IconButton {
  icon: React.ElementType;
  label: string;
}

const iconButtons: IconButton[] = [
  { icon: RefreshCw, label: "تحديث" },
  { icon: Calculator, label: "آلة حاسبة" },
  { icon: Printer, label: "طابعة" },
  { icon: Camera, label: "تصوير" },
  { icon: Keyboard, label: "لوحة مفاتيح" },
  { icon: Wrench, label: "أدوات" },
  { icon: Key, label: "مفتاح" },
  { icon: ScanLine, label: "مسح ضوئي" },
  { icon: Monitor, label: "شاشة" },
  { icon: HardDrive, label: "أقراص" },
];

export function LeftSidebar() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <aside className="hidden md:flex w-14 flex-col items-center bg-sidebar py-2 gap-1 border-r border-slate-800/50">
      {iconButtons.map((item, index) => {
        const Icon = item.icon;
        const isActive = activeIndex === index;
        return (
          <button
            key={index}
            onClick={() => setActiveIndex(isActive ? null : index)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
              isActive
                ? "bg-teal-600/20 text-teal-400"
                : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
            )}
            title={item.label}
            aria-label={item.label}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </aside>
  );
}

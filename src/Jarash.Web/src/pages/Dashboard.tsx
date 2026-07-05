import {
  Database,
  Receipt,
  ArrowLeftRight,
  Handshake,
  Mail,
} from "lucide-react";

interface CardItem {
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
}

const cards: CardItem[] = [
  {
    title: "نسخ قاعدة البيانات",
    description: "إنشاء نسخة احتياطية من قاعدة البيانات",
    icon: Database,
    iconBg: "bg-teal-500/20 text-teal-400",
  },
  {
    title: "سند صرف",
    description: "تسجيل عمليات صرف الأموال",
    icon: Receipt,
    iconBg: "bg-green-500/20 text-green-400",
  },
  {
    title: "صرافة",
    description: "تحويل وتبديل العملات وإدارة الصندوق",
    icon: ArrowLeftRight,
    iconBg: "bg-teal-500/20 text-teal-400",
  },
  {
    title: "سند دفع",
    description: "تسجيل المدفوعات",
    icon: Handshake,
    iconBg: "bg-teal-500/20 text-teal-400",
  },
  {
    title: "سند قبض",
    description: "تسجيل المقبوضات المالية",
    icon: Mail,
    iconBg: "bg-teal-500/20 text-teal-400",
  },
];

export default function Dashboard() {
  return (
    <div className="flex h-full items-center justify-center p-3 md:p-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 max-w-7xl w-full">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              className="group flex flex-col items-center gap-2 md:gap-5 rounded-xl md:rounded-2xl bg-card-bg p-3 md:p-8 text-white shadow-lg transition-all hover:shadow-teal-500/10 hover:shadow-xl hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <div className={`flex h-10 w-10 md:h-20 md:w-20 items-center justify-center rounded-lg md:rounded-2xl ${card.iconBg} transition-transform group-hover:scale-110`}>
                <Icon className="h-5 w-5 md:h-10 md:w-10" />
              </div>
              <div className="text-center">
                <h3 className="text-[11px] md:text-base font-bold">{card.title}</h3>
                <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs text-slate-400 leading-relaxed hidden md:block">
                  {card.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";

interface SectionPageProps {
  title: string;
  icon: React.ElementType;
  description?: string;
  accentColor?: string;
}

export function SectionPage({ title, icon: Icon, description, accentColor = "text-teal-400" }: SectionPageProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-12 text-center">
      <div className={cn("mb-6 rounded-2xl bg-slate-100 p-8", accentColor.replace("text-", "bg-").replace("/10", "/20"))}>
        <Icon className={cn("h-16 w-16", accentColor)} />
      </div>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      {description && (
        <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
      )}
      <div className="mt-8 h-px w-16 bg-slate-200" />
      <p className="mt-4 text-xs text-slate-400">هذا القسم قيد التطوير</p>
    </div>
  );
}

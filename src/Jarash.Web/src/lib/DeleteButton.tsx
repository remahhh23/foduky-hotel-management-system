import { Trash2 } from "lucide-react";
import ProtectedSection from "./ProtectedSection";

interface Props {
  onDelete: () => void;
  className?: string;
  title?: string;
}

export default function DeleteButton({ onDelete, className = "rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500", title = "حذف" }: Props) {
  return (
    <ProtectedSection permission="حذف">
      <button onClick={() => { if (confirm("تأكيد الحذف؟")) onDelete(); }} className={className} title={title}>
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </ProtectedSection>
  );
}

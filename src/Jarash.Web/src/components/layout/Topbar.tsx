import { LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Topbar() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="flex h-12 md:h-14 items-center justify-between border-b border-white/10 bg-sidebar px-2 md:px-4">
      <div className="flex items-center gap-1 md:gap-2">
        <span className="text-base md:text-lg font-bold text-white">جرش</span>
        <span className="text-[10px] md:text-xs text-gray-500">v1.0.0</span>
      </div>

      {isAuthenticated && user && (
        <div className="flex items-center gap-1 md:gap-3">
          <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-300">
            <User size={14} className="text-teal-500 hidden md:block" />
            <span className="hidden md:inline">{user.fullName}</span>
            <span className="rounded bg-white/10 px-1.5 md:px-2 py-0.5 text-[10px] md:text-xs text-gray-400">
              {user.role === "Admin" ? "مدير" : "مستخدم"}
            </span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1 rounded px-1.5 md:px-2 py-1 text-xs md:text-sm text-gray-400 transition hover:bg-red-500/10 hover:text-red-400"
            title="تسجيل الخروج"
          >
            <LogOut size={14} />
          </button>
        </div>
      )}
    </header>
  );
}

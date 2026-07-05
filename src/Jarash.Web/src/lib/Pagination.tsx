import { useState, useMemo } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <button disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}
        className="flex h-8 w-8 items-center justify-center rounded bg-white/5 text-slate-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed">
        <ChevronRight className="h-4 w-4" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => onPageChange(p)}
          className={`flex h-8 w-8 items-center justify-center rounded text-xs font-bold ${p === currentPage ? "bg-sky-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>
          {p}
        </button>
      ))}
      <button disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}
        className="flex h-8 w-8 items-center justify-center rounded bg-white/5 text-slate-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed">
        <ChevronLeft className="h-4 w-4" />
      </button>
    </div>
  );
}

export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedItems = useMemo(() => items.slice((safePage - 1) * pageSize, safePage * pageSize), [items, safePage, pageSize]);
  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
  return { page: safePage, totalPages, paginatedItems, goToPage, pageSize };
}

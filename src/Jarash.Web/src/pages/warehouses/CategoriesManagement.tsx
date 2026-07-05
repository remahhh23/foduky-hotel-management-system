import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Plus, Trash2, Package } from "lucide-react";
import { inventoryItemService } from "@/pages/inventory-reports/inventoryService";
import { logger } from "@/lib/logger";

interface Props {
  onBack: () => void;
}

const CATEGORIES_KEY = "jarash_inventory_categories";

function readCategories(): string[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeCategories(data: string[]) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(data));
}

export default function CategoriesManagement({ onBack }: Props) {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCat, setNewCat] = useState("");

  useEffect(() => {
    const stored = readCategories();
    const fromItems = inventoryItemService.getCategories();
    const all = new Set([...stored, ...fromItems]);
    setCategories(Array.from(all).sort());
  }, []);

  function handleAdd() {
    const cat = newCat.trim();
    if (!cat || categories.includes(cat)) return;
    const updated = [...categories, cat].sort();
    writeCategories(updated);
    setCategories(updated);
    inventoryItemService.syncCategoryCreated(cat);
    setNewCat("");
    logger.info("CategoriesManagement: added", { category: cat });
  }

  function handleDelete(cat: string) {
    const updated = categories.filter((c) => c !== cat);
    writeCategories(updated);
    inventoryItemService.syncCategoryDeleted(cat);
    setCategories(updated);
    logger.info("CategoriesManagement: deleted", { category: cat });
  }

  const items = inventoryItemService.getAll();
  const categoryCount = new Map<string, number>();
  for (const item of items) {
    categoryCount.set(item.category, (categoryCount.get(item.category) || 0) + 1);
  }

  return (
    <div className="rounded-lg bg-card-bg p-6 text-white shadow-md">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> رجوع
        </button>
        <h3 className="text-lg font-bold">تصنيفات الأصناف</h3>
      </div>

      <div className="mb-4 flex gap-2">
        <input placeholder="إضافة تصنيف جديد" value={newCat} onChange={(e) => setNewCat(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
        <button onClick={handleAdd}
          className="flex items-center gap-1 rounded bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700 transition">
          <Plus className="h-4 w-4" /> إضافة
        </button>
      </div>

      <div className="space-y-2">
        {categories.length === 0 ? (
          <div className="py-4 text-center text-sm text-slate-500">لا توجد تصنيفات</div>
        ) : (
          categories.map((cat) => (
            <div key={cat} className="flex items-center justify-between rounded border border-white/10 bg-white/5 px-4 py-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-sky-400" />
                <span className="text-sm">{cat}</span>
                <span className="text-xs text-slate-500">({categoryCount.get(cat) || 0} أصناف)</span>
              </div>
              <button onClick={() => handleDelete(cat)} className="text-red-400 hover:text-red-300 transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

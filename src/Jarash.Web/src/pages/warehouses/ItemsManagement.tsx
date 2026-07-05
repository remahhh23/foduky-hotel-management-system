import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Package } from "lucide-react";
import { inventoryItemService } from "@/pages/inventory-reports/inventoryService";
import type { InventoryItem } from "@/pages/inventory-reports/inventoryTypes";
import { logger } from "@/lib/logger";

interface Props {
  onBack: () => void;
}

export default function ItemsManagement({ onBack }: Props) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "", sku: "", category: "", warehouse: "", quantity: 0,
    unitCost: 0, sellingPrice: 0, reorderLevel: 0, expiryDate: "", notes: "",
  });

  useEffect(() => {
    setItems(inventoryItemService.getAll());
  }, []);

  const categories = useMemo(() => inventoryItemService.getCategories(), [items]);
  const warehouses = useMemo(() => inventoryItemService.getWarehouses(), [items]);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((i) =>
      i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
    );
  }, [items, search]);

  function resetForm() {
    setForm({ name: "", sku: "", category: "", warehouse: "", quantity: 0, unitCost: 0, sellingPrice: 0, reorderLevel: 0, expiryDate: "", notes: "" });
    setEditingId(null);
    setShowForm(false);
  }

  function openEdit(item: InventoryItem) {
    setForm({
      name: item.name, sku: item.sku, category: item.category,
      warehouse: item.warehouse, quantity: item.quantity, unitCost: item.unitCost,
      sellingPrice: item.sellingPrice, reorderLevel: item.reorderLevel,
      expiryDate: item.expiryDate, notes: item.notes,
    });
    setEditingId(item.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (editingId) {
      inventoryItemService.update(editingId, form);
      logger.info("ItemsManagement: updated", { id: editingId });
    } else {
      inventoryItemService.create(form);
      logger.info("ItemsManagement: created", { name: form.name });
    }
    if (form.category) inventoryItemService.syncCategoryCreated(form.category);
    if (form.warehouse) inventoryItemService.syncWarehouseCreated(form.warehouse);
    setItems(inventoryItemService.getAll());
    resetForm();
  }

  function handleDelete(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item || item.quantity > 0) {
      if (item && item.quantity > 0) {
        logger.warn("ItemsManagement: cannot delete item with stock", { id, qty: item.quantity });
        return;
      }
    }
    const updated = items.filter((i) => i.id !== id);
    localStorage.setItem("jarash_inventory_items", JSON.stringify(updated));
    setItems(updated);
    logger.info("ItemsManagement: deleted", { id });
  }

  const totalValue = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);

  return (
    <div className="rounded-lg bg-card-bg p-6 text-white shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" /> رجوع
          </button>
          <h3 className="text-lg font-bold">إدارة الأصناف</h3>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-2 text-sm text-white hover:bg-sky-700 transition">
          <Plus className="h-4 w-4" /> إضافة صنف
        </button>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="rounded bg-white/5 p-3 text-center">
          <div className="text-xs text-slate-400">عدد الأصناف</div>
          <div className="text-lg font-bold">{items.length}</div>
        </div>
        <div className="rounded bg-white/5 p-3 text-center">
          <div className="text-xs text-slate-400">إجمالي الكمية</div>
          <div className="text-lg font-bold" dir="ltr">{items.reduce((s, i) => s + i.quantity, 0).toLocaleString("en-US")}</div>
        </div>
        <div className="rounded bg-white/5 p-3 text-center">
          <div className="text-xs text-slate-400">قيمة المخزون</div>
          <div className="text-lg font-bold text-green-400" dir="ltr">{totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {showForm && (
        <div className="mb-4 rounded border border-sky-500/30 bg-sky-500/10 p-4">
          <h4 className="mb-3 text-sm font-bold text-sky-400">{editingId ? "تعديل صنف" : "إضافة صنف جديد"}</h4>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <input placeholder="اسم الصنف *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
            <input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
            <input placeholder="التصنيف" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
            <input placeholder="المستودع" value={form.warehouse} onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
              className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
            <input type="number" placeholder="سعر التكلفة" value={form.unitCost || ""} onChange={(e) => setForm({ ...form, unitCost: parseFloat(e.target.value) || 0 })}
              className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
            <input type="number" placeholder="سعر البيع" value={form.sellingPrice || ""} onChange={(e) => setForm({ ...form, sellingPrice: parseFloat(e.target.value) || 0 })}
              className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
            <input type="number" placeholder="حد إعادة الطلب" value={form.reorderLevel || ""} onChange={(e) => setForm({ ...form, reorderLevel: parseInt(e.target.value) || 0 })}
              className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
            <input type="date" placeholder="تاريخ انتهاء" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500" />
          </div>
          <textarea placeholder="ملاحظات" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="mt-3 w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" rows={2} />
          <div className="mt-3 flex gap-2">
            <button onClick={handleSave} className="flex items-center gap-1 rounded bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700 transition">
              <Save className="h-4 w-4" /> حفظ
            </button>
            <button onClick={resetForm} className="flex items-center gap-1 rounded bg-white/10 px-3 py-1.5 text-sm text-slate-400 hover:bg-white/20 transition">
              <X className="h-4 w-4" /> إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="mb-3">
        <input placeholder="بحث عن صنف..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400">
              <th className="px-3 py-2 text-right">الاسم</th>
              <th className="px-3 py-2 text-right">SKU</th>
              <th className="px-3 py-2 text-right">التصنيف</th>
              <th className="px-3 py-2 text-right">المستودع</th>
              <th className="px-3 py-2 text-left">الكمية</th>
              <th className="px-3 py-2 text-left">التكلفة</th>
              <th className="px-3 py-2 text-left">البيع</th>
              <th className="px-3 py-2 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-4 text-center text-sm text-slate-500">لا توجد أصناف. أضف صنفاً جديداً</td></tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-1.5 text-sm">{item.name}</td>
                  <td className="px-3 py-1.5 text-sm text-slate-400">{item.sku}</td>
                  <td className="px-3 py-1.5 text-sm text-slate-400">{item.category}</td>
                  <td className="px-3 py-1.5 text-sm text-slate-400">{item.warehouse}</td>
                  <td className={`px-3 py-1.5 text-left text-sm font-bold ${item.quantity <= item.reorderLevel ? "text-amber-400" : "text-white"}`} dir="ltr">{item.quantity}</td>
                  <td className="px-3 py-1.5 text-left text-sm text-slate-400" dir="ltr">{item.unitCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td className="px-3 py-1.5 text-left text-sm text-green-400" dir="ltr">{item.sellingPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td className="px-3 py-1.5 text-center">
                    <button onClick={() => openEdit(item)} className="mr-1 text-sky-400 hover:text-sky-300 transition" title="تعديل"><Pencil className="h-4 w-4 inline" /></button>
                    <button onClick={() => handleDelete(item.id)} className="mr-2 text-red-400 hover:text-red-300 transition" title="حذف"><Trash2 className="h-4 w-4 inline" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

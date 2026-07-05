import { useState, useEffect, useCallback } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { purchaseOrderService } from "./purchasesService";
import { supplierService } from "./purchasesService";
import type { Supplier, PurchaseOrderItem } from "./purchasesTypes";

export default function NewPurchaseOrder({ onBack }: { onBack: () => void }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const loadSuppliers = useCallback(() => {
    setSuppliers(supplierService.getAll());
  }, []);

  useEffect(() => { loadSuppliers(); }, [loadSuppliers]);

  const totalAmount = items.reduce((sum, i) => sum + i.totalPrice, 0);

  function addItem() {
    if (!itemName.trim()) return;
    setItems((prev) => [...prev, { itemName: itemName.trim(), quantity, unitPrice, totalPrice: quantity * unitPrice }]);
    setItemName("");
    setQuantity(1);
    setUnitPrice(0);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSupplierChange(id: string) {
    setSupplierId(id);
    const s = suppliers.find((s) => s.id === id);
    setSupplierName(s?.name ?? "");
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!supplierId) errs.supplierId = "المورد مطلوب";
    if (items.length === 0) errs.items = "يجب إضافة صنف واحد على الأقل";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      purchaseOrderService.create({ supplierId, supplierName, date, items, totalAmount, status: "pending", notes });
      logger.info("NewPurchaseOrder: created");
      onBack();
    } catch (err) {
      logger.error("NewPurchaseOrder: failed", err);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">إنشاء أمر شراء</h3>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl rounded-xl border border-white/10 bg-card-bg p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">المورد</label>
            <select value={supplierId} onChange={(e) => handleSupplierChange(e.target.value)}
              className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.supplierId ? "border-red-400" : "border-white/20")}>
              <option value="">اختر المورد</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.supplierId && <p className="mt-1 text-xs text-red-500">{errors.supplierId}</p>}
            {suppliers.length === 0 && <p className="mt-1 text-xs text-amber-500">لا يوجد موردون. أضف مورداً أولاً.</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">التاريخ</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-slate-400">الأصناف</label>
          <div className="rounded-lg border border-white/10 p-3">
            <div className="grid grid-cols-5 gap-2 mb-2">
              <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="اسم الصنف"
                className="col-span-2 rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
              <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500 text-center" />
              <input type="number" min={0} value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500 text-center" />
              <Button type="button" size="sm" onClick={addItem} className="h-full"><Plus className="h-4 w-4 ml-1" />إضافة</Button>
            </div>
            {items.length > 0 && (
              <div className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 py-1.5 text-sm">
                    <span className="flex-1 font-medium text-white">{item.itemName}</span>
                    <span className="w-16 text-center text-slate-400">ك{item.quantity}</span>
                    <span className="w-24 text-center text-slate-400">سعر: {item.unitPrice.toLocaleString()}</span>
                    <span className="w-24 text-center font-medium text-sky-600">{item.totalPrice.toLocaleString()}</span>
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
            {errors.items && <p className="mt-1 text-xs text-red-500">{errors.items}</p>}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-slate-400">ملاحظات</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
        </div>

        <div className="mb-6 flex items-center justify-between rounded-lg bg-sky-50 px-4 py-3">
          <span className="text-sm font-medium text-slate-400">الإجمالي</span>
          <span className="text-lg font-bold text-sky-700">{totalAmount.toLocaleString()}</span>
        </div>

        <div className="flex gap-2">
          <Button type="submit">إنشاء الأمر</Button>
          <Button type="button" variant="outline" onClick={onBack}>إلغاء</Button>
        </div>
      </form>
    </div>
  );
}

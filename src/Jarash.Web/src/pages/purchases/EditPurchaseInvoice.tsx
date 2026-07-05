import { useState, useEffect, useCallback } from "react";
import { Edit3, Trash2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { purchaseInvoiceService } from "./purchasesService";
import { PURCHASE_INVOICE_STATUS_LABELS, PURCHASE_INVOICE_STATUS_COLORS } from "./purchasesTypes";
import type { PurchaseInvoice, PurchaseInvoiceItem } from "./purchasesTypes";

export default function EditPurchaseInvoice({ onBack }: { onBack: () => void }) {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ date: "", paidAmount: 0, notes: "" });
  const [items, setItems] = useState<PurchaseInvoiceItem[]>([]);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);

  const load = useCallback(() => {
    setInvoices(purchaseInvoiceService.getAll());
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(inv: PurchaseInvoice) {
    if (inv.status === "returned" || inv.status === "cancelled") {
      alert("لا يمكن تعديل فاتورة مرتجعة أو ملغية");
      return;
    }
    setEditId(inv.id);
    setForm({ date: inv.date, paidAmount: inv.paidAmount, notes: inv.notes });
    setItems([...inv.items]);
  }

  function cancelEdit() {
    setEditId(null);
    setItems([]);
    setForm({ date: "", paidAmount: 0, notes: "" });
  }

  function addItem() {
    if (!itemName.trim()) return;
    setItems((prev) => [...prev, { itemName: itemName.trim(), quantity, unitPrice, totalPrice: quantity * unitPrice }]);
    setItemName(""); setQuantity(1); setUnitPrice(0);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSave() {
    if (!editId) return;
    const totalAmount = items.reduce((sum, i) => sum + i.totalPrice, 0);
    purchaseInvoiceService.update(editId, { ...form, items, totalAmount });
    logger.info("EditPurchaseInvoice: updated", { id: editId });
    cancelEdit();
    load();
  }

  function handleDelete(id: string) {
    if (!confirm("تأكيد حذف هذه الفاتورة؟")) return;
    purchaseInvoiceService.delete(id);
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">تعديل الفواتير</h3>
      </div>

      {editId && (
        <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
          <h4 className="text-sm font-bold text-sky-800 mb-3">تعديل الفاتورة</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">التاريخ</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">المبلغ المدفوع</label>
              <input type="number" min={0} value={form.paidAmount} onChange={(e) => setForm((f) => ({ ...f, paidAmount: Number(e.target.value) }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">ملاحظات</label>
              <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </div>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-slate-400">الأصناف</label>
            <div className="flex gap-2 mb-2">
              <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="اسم الصنف"
                className="flex-1 rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
              <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-20 rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500 text-center" />
              <input type="number" min={0} value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-24 rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500 text-center" />
              <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus className="h-4 w-4" /></Button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 py-1 text-sm">
                <span className="flex-1 text-slate-300">{item.itemName}</span>
                <span className="w-16 text-center text-slate-500">{item.quantity}</span>
                <span className="w-24 text-center text-slate-500">{item.unitPrice.toLocaleString()}</span>
                <span className="w-24 text-center font-medium text-sky-600">{item.totalPrice.toLocaleString()}</span>
                <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>حفظ التعديلات</Button>
            <Button size="sm" variant="outline" onClick={cancelEdit}>إلغاء</Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-slate-400">رقم الفاتورة</th>
              <th className="px-4 py-3 text-right font-medium text-slate-400">المورد</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">التاريخ</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">الإجمالي</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">المدفوع</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">الحالة</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">لا توجد فواتير</td></tr>
            )}
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{inv.invoiceNumber}</td>
                <td className="px-4 py-3 text-slate-400">{inv.supplierName}</td>
                <td className="px-4 py-3 text-center text-slate-400">{inv.date}</td>
                <td className="px-4 py-3 text-center text-white font-medium">{inv.totalAmount.toLocaleString()}</td>
                <td className="px-4 py-3 text-center text-green-600 font-medium">{inv.paidAmount.toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", PURCHASE_INVOICE_STATUS_COLORS[inv.status])}>
                    {PURCHASE_INVOICE_STATUS_LABELS[inv.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => startEdit(inv)} className="rounded p-1.5 text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-colors" title="تعديل">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(inv.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="حذف">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

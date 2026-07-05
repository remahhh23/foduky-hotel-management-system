import { useState, useEffect, useCallback } from "react";
import { Trash2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { purchaseInvoiceService, purchaseReturnService } from "./purchasesService";
import { recordExternalReceipt, ensureAccount } from "@/lib/integration";
import { journalEntryService } from "@/pages/accounts/accountsService";
import type { PurchaseInvoice, PurchaseReturnItem, PurchaseReturn } from "./purchasesTypes";

export default function PurchaseReturn({ onBack }: { onBack: () => void }) {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [items, setItems] = useState<PurchaseReturnItem[]>([]);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const load = useCallback(() => {
    setInvoices(purchaseInvoiceService.getAll());
    setReturns(purchaseReturnService.getAll());
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleInvoiceSelect(invoiceId: string) {
    setSelectedInvoiceId(invoiceId);
    const inv = invoices.find((i) => i.id === invoiceId);
    if (inv) {
      setItems(inv.items.map((i) => ({ itemName: i.itemName, quantity: i.quantity, unitPrice: i.unitPrice, totalPrice: i.totalPrice, reason: "" })));
    }
  }

  const totalAmount = items.reduce((sum, i) => sum + i.totalPrice, 0);

  function addItem() {
    if (!itemName.trim()) return;
    setItems((prev) => [...prev, { itemName: itemName.trim(), quantity, unitPrice, totalPrice: quantity * unitPrice, reason }]);
    setItemName(""); setQuantity(1); setUnitPrice(0); setReason("");
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateReason(idx: number, val: string) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, reason: val } : item));
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (items.length === 0) errs.items = "يجب إضافة صنف واحد على الأقل";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      const inv = invoices.find((i) => i.id === selectedInvoiceId);
      const ret = purchaseReturnService.create({
        invoiceId: selectedInvoiceId,
        supplierId: inv?.supplierId ?? "",
        supplierName: inv?.supplierName ?? "",
        date: new Date().toISOString().split("T")[0],
        items, totalAmount, notes,
      });
      if (inv) {
        purchaseInvoiceService.update(inv.id, { status: "returned" });
        const date = new Date().toISOString().split("T")[0];
        const supCode = inv.supplierId.includes("_") ? inv.supplierId.split("_")[1]?.substring(0,8) || inv.supplierId.substring(0,8) : inv.supplierId.substring(0,8);
        const supAccountId = ensureAccount(`2010${supCode}`, `دائن ${inv.supplierName}`, "liability");
        const purchasesAccountId = ensureAccount("500002", "مشتريات", "expense");
        journalEntryService.create({
          date,
          memo: `مرتجع شراء ${ret.returnNumber}`,
          lines: [
            { id: "1", accountId: supAccountId, accountName: `دائن ${inv.supplierName}`, description: "", debit: totalAmount, credit: 0 },
            { id: "2", accountId: purchasesAccountId, accountName: "مشتريات", description: "", debit: 0, credit: totalAmount },
          ],
          status: "posted",
        });
        recordExternalReceipt(
          `مرتجع شراء ${ret.returnNumber} من ${inv.supplierName}`,
          totalAmount,
          inv.supplierName,
          ret.returnNumber,
          date,
        );
      }
      logger.info("PurchaseReturn: created");
      setSelectedInvoiceId("");
      setItems([]);
      setNotes("");
      load();
    } catch (err) {
      logger.error("PurchaseReturn: failed", err);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">مرتجع شراء</h3>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl rounded-xl border border-white/10 bg-card-bg p-6 shadow-sm">
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-slate-400">الفاتورة</label>
          <select value={selectedInvoiceId} onChange={(e) => handleInvoiceSelect(e.target.value)}
            className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.items ? "border-red-400" : "border-white/20")}>
            <option value="">اختر الفاتورة</option>
            {invoices.filter((i) => i.status !== "returned" && i.status !== "cancelled").map((inv) => (
              <option key={inv.id} value={inv.id}>{inv.invoiceNumber} — {inv.supplierName}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-slate-400">الأصناف المرتجعة</label>
          <div className="rounded-lg border border-white/10 p-3">
            <div className="grid grid-cols-6 gap-2 mb-2">
              <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="اسم الصنف"
                className="col-span-2 rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
              <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500 text-center" />
              <input type="number" min={0} value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500 text-center" />
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="السبب"
                className="rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500 text-xs" />
              <Button type="button" size="sm" onClick={addItem}><Plus className="h-4 w-4 ml-1" />إضافة</Button>
            </div>
            {items.length > 0 && (
              <div className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 py-1.5 text-sm">
                    <span className="flex-1 font-medium text-white">{item.itemName}</span>
                    <span className="w-16 text-center text-slate-400">{item.quantity}</span>
                    <span className="w-20 text-center text-slate-400">{item.unitPrice.toLocaleString()}</span>
                    <input value={item.reason} onChange={(e) => updateReason(idx, e.target.value)} placeholder="سبب الإرجاع"
                      className="flex-1 rounded border border-white/10 px-2 py-1 text-xs outline-none focus:border-sky-500" />
                    <span className="w-20 text-center font-medium text-red-600">{item.totalPrice.toLocaleString()}</span>
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

        <div className="mb-6 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3">
          <span className="text-sm font-medium text-slate-400">إجمالي المرتجع</span>
          <span className="text-lg font-bold text-red-700">{totalAmount.toLocaleString()}</span>
        </div>

        <div className="flex gap-2">
          <Button type="submit">تسجيل المرتجع</Button>
          <Button type="button" variant="outline" onClick={onBack}>إلغاء</Button>
        </div>
      </form>

      {returns.length > 0 && (
        <div className="mt-8">
          <h4 className="text-sm font-bold text-white mb-3">المرتجعات السابقة</h4>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-right font-medium text-slate-400">رقم المرتجع</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-400">المورد</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-400">التاريخ</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-400">الإجمالي</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-400 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returns.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{r.returnNumber}</td>
                    <td className="px-4 py-3 text-slate-400">{r.supplierName}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{r.date}</td>
                    <td className="px-4 py-3 text-center text-red-600 font-medium">{r.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => { if (confirm("تأكيد حذف هذا المرتجع؟")) { purchaseReturnService.delete(r.id); load(); } }}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

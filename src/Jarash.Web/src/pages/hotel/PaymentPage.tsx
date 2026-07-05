import { useState, useEffect, useCallback } from "react";
import { Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { invoiceService } from "./invoiceService";
import { cashTransactionService } from "@/pages/cash/cashService";
import { getOccupiedRooms } from "./hotelUtils";
import { recordExternalReceipt } from "@/lib/integration";
import type { Invoice } from "./hotelTypes";
import type { OccupiedRoom } from "./hotelUtils";

const emptyForm = { guestName: "", roomNumber: "", description: "", amount: 0, date: new Date().toISOString().split("T")[0], notes: "" };

export default function PaymentPage({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<Invoice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [occupiedRooms, setOccupiedRooms] = useState<OccupiedRoom[]>([]);
  const [selectedReservationId, setSelectedReservationId] = useState("");

  const load = useCallback(async () => {
    const [inv, rooms] = await Promise.all([invoiceService.getByType("payment"), getOccupiedRooms()]);
    setItems(inv);
    setOccupiedRooms(rooms);
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleRoomSelect(roomNumber: string) {
    const found = occupiedRooms.find((r) => r.roomNumber === roomNumber);
    setForm((f) => ({ ...f, roomNumber: found?.roomNumber ?? "", guestName: found?.guestName ?? "" }));
    setSelectedReservationId(found?.reservationId ?? "");
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.roomNumber.trim()) errs.roomNumber = "الغرفة مطلوبة";
    if (!form.guestName.trim()) errs.guestName = "اسم النزيل مطلوب";
    if (!form.description.trim()) errs.description = "الوصف مطلوب";
    if (form.amount <= 0) errs.amount = "المبلغ يجب أن يكون أكبر من صفر";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (editId) {
        await invoiceService.update(editId, form);
      } else {
        await invoiceService.create({ ...form, invoiceType: "payment", status: "paid", reservationId: selectedReservationId || undefined });
        recordExternalReceipt(
          `دفعة إقامة للنزيل ${form.guestName} - ${form.description}`,
          form.amount,
          form.guestName,
          selectedReservationId ? `RES-${selectedReservationId.slice(-8)}` : "",
          form.date,
        );
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
      setErrors({});
      await load();
    } catch (err) {
      logger.error("PaymentPage: save failed", err);
    }
  }

  function handleEdit(inv: Invoice) {
    setEditId(inv.id);
    setForm({ guestName: inv.guestName, roomNumber: inv.roomNumber, description: inv.description, amount: inv.amount, date: inv.date, notes: inv.notes });
    setShowForm(true);
    setErrors({});
  }

  async function handleDelete(inv: Invoice) {
    if (!confirm("تأكيد حذف هذه الدفعة؟\nسيتم عكس المعاملة النقدية.")) return;
    const cashTxns = cashTransactionService.getAll().filter((t) => t.reference && t.reference.includes(inv.id.slice(-8)));
    for (const txn of cashTxns) {
      cashTransactionService.create({
        fundId: txn.fundId, fundName: txn.fundName,
        type: txn.type === "receipt" ? "payment" : "receipt",
        amount: txn.amount,
        description: `عكس: ${txn.description}`,
        reference: `REV-${inv.id.slice(-8)}`,
        counterparty: txn.counterparty,
        notes: `إلغاء دفعة ${inv.id}`,
        date: new Date().toISOString().split("T")[0],
      });
    }
    await invoiceService.delete(inv.id);
    await load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
          <h3 className="text-lg font-bold text-white">السداد <span className="text-sm font-normal text-slate-400">({items.length})</span></h3>
        </div>
        <Button size="sm" onClick={() => { setEditId(null); setForm(emptyForm); setErrors({}); setShowForm(true); }}>
          تسجيل دفعة
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-white/10 bg-card-bg p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">الغرفة</label>
              <select
                value={form.roomNumber}
                onChange={(e) => handleRoomSelect(e.target.value)}
                className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-sky-500", errors.roomNumber ? "border-red-400" : "border-white/20")}
              >
                <option value="">اختر الغرفة</option>
                {occupiedRooms.map((r) => (
                  <option key={r.roomNumber} value={r.roomNumber}>غرفة {r.roomNumber} — {r.guestName}</option>
                ))}
              </select>
              {errors.roomNumber && <p className="mt-1 text-xs text-red-500">{errors.roomNumber}</p>}
              {occupiedRooms.length === 0 && <p className="mt-1 text-xs text-amber-500">لا توجد غرف مشغولة</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">اسم النزيل</label>
              <input value={form.guestName} readOnly
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 outline-none" />
              {errors.guestName && <p className="mt-1 text-xs text-red-500">{errors.guestName}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">المبلغ</label>
              <input type="number" min={0} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.amount ? "border-red-400" : "border-white/20")} />
              {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">التاريخ</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-400">الوصف</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500", errors.description ? "border-red-400" : "border-white/20")} />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-400">ملاحظات</label>
              <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" size="sm">{editId ? "تحديث" : "تسجيل"}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); setErrors({}); }}>إلغاء</Button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-slate-400">النزيل</th>
              <th className="px-4 py-3 text-right font-medium text-slate-400">الوصف</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">الغرفة</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">التاريخ</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400">المبلغ</th>
              <th className="px-4 py-3 text-center font-medium text-slate-400 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">لا توجد دفعات بعد</td></tr>
            )}
            {items.map((inv) => (
              <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{inv.guestName}</td>
                <td className="px-4 py-3 text-slate-500">{inv.description}</td>
                <td className="px-4 py-3 text-center text-slate-500">{inv.roomNumber || "—"}</td>
                <td className="px-4 py-3 text-center text-slate-400">{inv.date}</td>
                <td className="px-4 py-3 text-center text-slate-400 font-medium">{inv.amount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => handleEdit(inv)} className="rounded p-1.5 text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-colors" title="تعديل">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(inv)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="حذف">
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

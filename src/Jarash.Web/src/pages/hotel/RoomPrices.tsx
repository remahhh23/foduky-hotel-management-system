import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Save, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { roomService } from "./roomService";
import type { SeasonPrice } from "./hotelTypes";

export default function RoomPrices({ onBack }: { onBack: () => void }) {
  const [roomTypes, setRoomTypes] = useState<{ id: string; name: string }[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [prices, setPrices] = useState<SeasonPrice[]>([]);
  const [newSeason, setNewSeason] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [editMap, setEditMap] = useState<Record<string, { seasonName: string; price: number }>>({});

  const loadPrices = useCallback(async (typeId: string) => {
    const data = await roomService.getPricesByType(typeId);
    setPrices(data);
    setEditMap({});
  }, []);

  useEffect(() => {
    roomService.getRoomTypes().then(setRoomTypes);
  }, []);

  useEffect(() => {
    if (selectedTypeId) loadPrices(selectedTypeId);
  }, [selectedTypeId, loadPrices]);

  async function handleAdd() {
    if (!newSeason.trim() || !newPrice) return;
    await roomService.upsertPrice({ roomTypeId: selectedTypeId, seasonName: newSeason.trim(), price: Number(newPrice) });
    setNewSeason("");
    setNewPrice("");
    await loadPrices(selectedTypeId);
  }

  async function handleSaveEdit(id: string) {
    const data = editMap[id];
    if (!data) return;
    await roomService.upsertPrice({ id, roomTypeId: selectedTypeId, seasonName: data.seasonName, price: data.price });
    await loadPrices(selectedTypeId);
  }

  async function handleDelete(id: string) {
    if (!confirm("تأكيد حذف هذا السعر؟")) return;
    await roomService.deletePrice(id);
    await loadPrices(selectedTypeId);
  }

  const selectedType = roomTypes.find((t) => t.id === selectedTypeId);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">أسعار الغرف</h3>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-slate-400">اختر نوع الغرفة</label>
        <select
          value={selectedTypeId}
          onChange={(e) => setSelectedTypeId(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500"
        >
          <option value="">اختر النوع</option>
          {roomTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {!selectedTypeId && (
        <p className="py-8 text-center text-sm text-slate-400">يرجى اختيار نوع الغرفة لعرض الأسعار</p>
      )}

      {selectedTypeId && (
        <>
          <div className="mb-4 flex items-end gap-3 rounded-xl border border-white/10 bg-card-bg p-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-400">الموسم</label>
              <input
                value={newSeason}
                onChange={(e) => setNewSeason(e.target.value)}
                placeholder="مثال: موسم الذروة"
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div className="w-36">
              <label className="mb-1 block text-xs font-medium text-slate-400">السعر</label>
              <input
                type="number" min={0}
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <Button size="sm" onClick={handleAdd} disabled={!newSeason.trim() || !newPrice}>
              <Plus className="h-4 w-4 ml-1" /> إضافة
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-right font-medium text-slate-400">{selectedType?.name ?? ""} — الموسم <span className="text-sm font-normal text-slate-400">({prices.length})</span></th>
                  <th className="px-4 py-3 text-center font-medium text-slate-400">السعر</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-400 w-28"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prices.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">لا توجد أسعار بعد</td></tr>
                )}
                {prices.map((p) => {
                  const editing = editMap[p.id];
                  const isEditing = editing !== undefined;
                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={editing.seasonName}
                            onChange={(e) => setEditMap((m) => ({ ...m, [p.id]: { ...m[p.id], seasonName: e.target.value } }))}
                            className="w-full rounded border border-white/20 px-2 py-1 text-sm outline-none focus:border-sky-500"
                          />
                        ) : (
                          <span className="font-medium text-white">{p.seasonName}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <input
                            type="number" min={0}
                            value={editing.price}
                            onChange={(e) => setEditMap((m) => ({ ...m, [p.id]: { ...m[p.id], price: Number(e.target.value) } }))}
                            className="w-24 rounded border border-white/20 px-2 py-1 text-center text-sm outline-none focus:border-sky-500"
                          />
                        ) : (
                          <span className="font-semibold text-slate-300">{p.price.toLocaleString()} ‏د.م</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          {isEditing ? (
                            <button onClick={() => handleSaveEdit(p.id)} className="rounded p-1.5 text-green-600 hover:bg-green-50 transition-colors" title="حفظ">
                              <Save className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditMap((m) => ({ ...m, [p.id]: { seasonName: p.seasonName, price: p.price } }))}
                              className="rounded p-1.5 text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                              title="تعديل"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => handleDelete(p.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="حذف">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

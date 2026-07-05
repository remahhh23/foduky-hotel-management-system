import { useState, useEffect, useCallback } from "react";
import { BedDouble, User, Phone, Calendar, DollarSign, FileText, Edit3, XCircle, Clock, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { roomService } from "./roomService";
import { reservationService } from "./reservationService";
import { ROOM_STATUS_LABELS, ROOM_STATUS_COLORS, RESERVATION_STATUS_LABELS, RESERVATION_STATUS_COLORS } from "./hotelTypes";
import type { Room, RoomType, Reservation } from "./hotelTypes";

interface Props {
  onBack: () => void;
  roomId: string;
  onEdit: (reservationId: string) => void;
  onCancel: (reservationId: string) => void;
  onExtend: (reservationId: string) => void;
  onCheckout: (reservationId: string) => void;
}

export default function RoomDetail({ onBack, roomId, onEdit, onCancel, onExtend }: Props) {
  const [room, setRoom] = useState<Room | null>(null);
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [rooms, types, reservations] = await Promise.all([
        roomService.getRooms(),
        roomService.getRoomTypes(),
        reservationService.getAll(),
      ]);
      const foundRoom = rooms.find((r) => r.id === roomId) || null;
      setRoom(foundRoom);
      if (foundRoom) {
        setRoomType(types.find((t) => t.id === foundRoom.typeId) || null);
      }
      const foundRes = reservations.find((r) => r.roomId === roomId && (r.status === "active" || r.status === "checked-in")) || null;
      setReservation(foundRes);
    } catch (err) {
      logger.error("RoomDetail: failed to load", err);
      const rooms = roomService.getRoomsLocal();
      const types = roomService.getRoomTypesLocal();
      const reservations = reservationService.getAllLocal();
      const foundRoom = rooms.find((r) => r.id === roomId) || null;
      setRoom(foundRoom);
      if (foundRoom) {
        setRoomType(types.find((t) => t.id === foundRoom.typeId) || null);
      }
      setReservation(reservations.find((r) => r.roomId === roomId && (r.status === "active" || r.status === "checked-in")) || null);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-slate-400">جاري التحميل...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div>
        <button onClick={onBack} className="mb-4 text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <div className="rounded-xl border border-white/10 p-8 text-center">
          <p className="text-slate-400">الغرفة غير موجودة</p>
        </div>
      </div>
    );
  }

  const statusColor = reservation
    ? reservation.status === "checked-in"
      ? ROOM_STATUS_COLORS.occupied
      : ROOM_STATUS_COLORS.reserved
    : ROOM_STATUS_COLORS[room.status];

  const statusLabel = reservation
    ? reservation.status === "checked-in"
      ? ROOM_STATUS_LABELS.occupied
      : ROOM_STATUS_LABELS.reserved
    : ROOM_STATUS_LABELS[room.status];

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">تفاصيل الغرفة</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-white/10 bg-card-bg p-5">
            <div className="flex flex-col items-center gap-3 mb-4">
              <BedDouble className="h-12 w-12 text-sky-400" />
              <span className="text-3xl font-bold text-white">غرفة {room.roomNumber}</span>
              <span className={cn("inline-block rounded-full px-3 py-1 text-sm font-medium", statusColor)}>
                {statusLabel}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">الطابق</span>
                <span className="text-white">{room.floor}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">نوع الغرفة</span>
                <span className="text-white">{roomType?.name || "—"}</span>
              </div>
              {roomType && (
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">الحد الأقصى للنزلاء</span>
                  <span className="text-white">{roomType.maxGuests}</span>
                </div>
              )}
              {room.notes && (
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">ملاحظات</span>
                  <span className="text-white text-xs">{room.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {reservation ? (
            <div className="rounded-xl border border-white/10 bg-card-bg p-5">
              <h4 className="mb-4 text-base font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-sky-400" />
                الحجز النشط
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                  <User className="h-5 w-5 text-sky-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">اسم النزيل</p>
                    <p className="text-sm font-medium text-white">{reservation.guestName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                  <Phone className="h-5 w-5 text-sky-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">رقم الهاتف</p>
                    <p className="text-sm font-medium text-white">{reservation.guestPhone || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                  <Calendar className="h-5 w-5 text-green-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">تاريخ الدخول</p>
                    <p className="text-sm font-medium text-white">{reservation.checkIn}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                  <Calendar className="h-5 w-5 text-red-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">تاريخ المغادرة</p>
                    <p className="text-sm font-medium text-white">{reservation.checkOut}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                  <DollarSign className="h-5 w-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">المبلغ الإجمالي</p>
                    <p className="text-sm font-medium text-white" dir="ltr">{reservation.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                  <div>
                    <p className="text-xs text-slate-400">حالة الحجز</p>
                    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium mt-1", RESERVATION_STATUS_COLORS[reservation.status])}>
                      {RESERVATION_STATUS_LABELS[reservation.status]}
                    </span>
                  </div>
                </div>
              </div>

              {reservation.notes && (
                <div className="mb-4 rounded-lg bg-white/5 p-3">
                  <p className="text-xs text-slate-400 mb-1">ملاحظات الحجز</p>
                  <p className="text-sm text-white">{reservation.notes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 border-t border-white/10 pt-4">
                <button
                  onClick={() => onEdit(reservation.id)}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-400 hover:bg-sky-500/20 transition-colors"
                >
                  <Edit3 className="h-4 w-4" /> تعديل الحجز
                </button>
                <button
                  onClick={() => onCancel(reservation.id)}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <XCircle className="h-4 w-4" /> إلغاء الحجز
                </button>
                <button
                  onClick={() => onExtend(reservation.id)}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
                >
                  <Clock className="h-4 w-4" /> تمديد الإقامة
                </button>
                <button
                  onClick={() => onCheckout(reservation.id)}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> إنهاء الإقامة
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-card-bg p-8 text-center">
              <BedDouble className="mx-auto mb-3 h-10 w-10 text-green-400" />
              <p className="text-base font-medium text-white mb-1">الغرفة متاحة</p>
              <p className="text-sm text-slate-400">لا يوجد حجز نشط لهذه الغرفة حالياً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

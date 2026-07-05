import { useState, useEffect, useCallback } from "react";
import { DoorOpen, BedDouble, Users, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { roomService } from "./roomService";
import { reservationService } from "./reservationService";
import { ROOM_STATUS_LABELS, ROOM_STATUS_COLORS } from "./hotelTypes";
import type { Room, RoomType, Reservation } from "./hotelTypes";

interface Props {
  onBack: () => void;
  onNewReservation: (roomId: string) => void;
  onRoomDetail: (roomId: string, reservationId: string) => void;
}

export default function RoomGrid({ onBack, onNewReservation, onRoomDetail }: Props) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [r, rt, res] = await Promise.all([
      roomService.getRooms(),
      roomService.getRoomTypes(),
      reservationService.getActive(),
    ]);
    setRooms(r);
    setRoomTypes(rt);
    setReservations(res);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const typeMap = new Map(roomTypes.map((t) => [t.id, t.name]));
  const reservedRoomIds = new Set(reservations.map((r) => r.roomId));
  const reservationByRoom = new Map(reservations.map((r) => [r.roomId, r]));

  function getRoomStatus(room: Room): { label: string; colorClass: string } {
    if (reservedRoomIds.has(room.id)) {
      const res = reservationByRoom.get(room.id);
      if (res?.status === "checked-in") {
        return { label: ROOM_STATUS_LABELS.occupied, colorClass: ROOM_STATUS_COLORS.occupied };
      }
      return { label: ROOM_STATUS_LABELS.reserved, colorClass: ROOM_STATUS_COLORS.reserved };
    }
    return { label: ROOM_STATUS_LABELS[room.status], colorClass: ROOM_STATUS_COLORS[room.status] };
  }

  function handleRoomClick(room: Room) {
    if (reservedRoomIds.has(room.id)) {
      const res = reservationByRoom.get(room.id)!;
      onRoomDetail(room.id, res.id);
    } else {
      onNewReservation(room.id);
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-slate-400">جاري تحميل الغرف...</p>
      </div>
    );
  }

  const floors = [...new Set(rooms.map((r) => r.floor))].sort();

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-800 transition-colors">← رجوع</button>
        <h3 className="text-lg font-bold text-white">لوحة الغرف</h3>
        <span className="text-sm text-slate-400">({rooms.length} غرفة)</span>
      </div>

      {rooms.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 p-8 text-center">
          <DoorOpen className="h-12 w-12 text-slate-500" />
          <p className="text-sm text-slate-400">لا توجد غرف مضافة بعد</p>
          <p className="text-xs text-slate-500">أضف غرفاً جديدة من قسم تعريف الغرف</p>
        </div>
      )}

      {rooms.length > 0 && (
        <div className="space-y-6">
          {floors.map((floor) => {
            const floorRooms = rooms.filter((r) => r.floor === floor);
            return (
              <div key={floor}>
                <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
                  <Layers className="h-4 w-4" />
                  <span>الطابق {floor}</span>
                  <span className="text-xs text-slate-500">({floorRooms.length} غرف)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {floorRooms.map((room) => {
                    const status = getRoomStatus(room);
                    const typeName = typeMap.get(room.typeId) || "—";
                    const guestName = reservationByRoom.get(room.id)?.guestName;
                    return (
                      <button
                        key={room.id}
                        onClick={() => handleRoomClick(room)}
                        className={cn(
                          "group flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                          reservedRoomIds.has(room.id) ? "border-red-500/30 bg-red-500/5" : "border-green-500/30 bg-green-500/5",
                        )}
                      >
                        <BedDouble className={cn(
                          "h-6 w-6 transition-transform group-hover:scale-110",
                          reservedRoomIds.has(room.id) ? "text-red-400" : "text-green-400",
                        )} />
                        <span className="text-lg font-bold text-white">{room.roomNumber}</span>
                        <span className="text-[10px] text-slate-500">{typeName}</span>
                        <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", status.colorClass)}>
                          {status.label}
                        </span>
                        {guestName && (
                          <span className="text-[10px] text-slate-400 truncate max-w-full">{guestName}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

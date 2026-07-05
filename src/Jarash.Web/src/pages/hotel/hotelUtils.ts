import { reservationService } from "./reservationService";
import { roomService } from "./roomService";

export interface OccupiedRoom {
  roomNumber: string;
  guestName: string;
  reservationId: string;
}

export async function getOccupiedRooms(): Promise<OccupiedRoom[]> {
  const [activeReservations, rooms] = await Promise.all([
    reservationService.getActive(),
    roomService.getRooms(),
  ]);
  return activeReservations
    .map((r) => {
      const room = rooms.find((rm) => rm.id === r.roomId);
      return room ? { roomNumber: room.roomNumber, guestName: r.guestName, reservationId: r.id } : null;
    })
    .filter((x): x is OccupiedRoom => x !== null);
}

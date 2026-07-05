import { hotelApi } from "@/lib/hotel-api";
import { logger } from "@/lib/logger";
import type { RoomType, Room, SeasonPrice } from "./hotelTypes";

const STORAGE_ROOM_TYPES = "jarash_room_types";
const STORAGE_ROOMS = "jarash_rooms";
const STORAGE_PRICES = "jarash_room_prices";

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 2000;

function read<T>(key: string, fallback: T): T {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data as T;
  try {
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : fallback;
    cache.set(key, { data, ts: Date.now() });
    return data;
  } catch {
    cache.set(key, { data: fallback, ts: Date.now() });
    return fallback;
  }
}
function write<T>(key: string, data: T): void {
  cache.set(key, { data, ts: Date.now() });
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* */ }
}

let idCounter = Date.now();
function nextId(): string { return `id_${++idCounter}`; }

export const roomService = {
  getRoomTypesLocal(): RoomType[] {
    return read<RoomType[]>(STORAGE_ROOM_TYPES, []);
  },

  getRoomsLocal(): Room[] {
    return read<Room[]>(STORAGE_ROOMS, []);
  },

  getPricesLocal(): SeasonPrice[] {
    return read<SeasonPrice[]>(STORAGE_PRICES, []);
  },

  async getRoomTypes(): Promise<RoomType[]> {
    hotelApi.getRoomTypes().then((data) => write(STORAGE_ROOM_TYPES, data)).catch(() => {});
    return read<RoomType[]>(STORAGE_ROOM_TYPES, []);
  },

  async addRoomType(data: Omit<RoomType, "id">): Promise<RoomType> {
    const types = read<RoomType[]>(STORAGE_ROOM_TYPES, []);
    const item: RoomType = { id: nextId(), ...data };
    types.push(item);
    write(STORAGE_ROOM_TYPES, types);
    hotelApi.createRoomType(data).then(() => {}).catch(() => {});
    logger.info("roomService: room type added", { id: item.id });
    return item;
  },

  async updateRoomType(id: string, data: Partial<RoomType>): Promise<RoomType | null> {
    const types = read<RoomType[]>(STORAGE_ROOM_TYPES, []);
    const idx = types.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    types[idx] = { ...types[idx], ...data };
    write(STORAGE_ROOM_TYPES, types);
    hotelApi.updateRoomType(id, data).then(() => {}).catch(() => {});
    return types[idx];
  },

  async deleteRoomType(id: string): Promise<boolean> {
    const types = read<RoomType[]>(STORAGE_ROOM_TYPES, []);
    const filtered = types.filter((t) => t.id !== id);
    if (filtered.length === types.length) return false;
    write(STORAGE_ROOM_TYPES, filtered);
    hotelApi.deleteRoomType(id).then(() => {}).catch(() => {});
    return true;
  },

  /* Rooms */
  async getRooms(): Promise<Room[]> {
    hotelApi.getRooms().then((data) => write(STORAGE_ROOMS, data)).catch(() => {});
    return read<Room[]>(STORAGE_ROOMS, []);
  },

  async addRoom(data: Omit<Room, "id">): Promise<Room> {
    const rooms = read<Room[]>(STORAGE_ROOMS, []);
    if (rooms.some((r) => r.roomNumber === data.roomNumber))
      throw new Error(`رقم الغرفة ${data.roomNumber} موجود مسبقاً`);
    const item: Room = { id: nextId(), ...data };
    rooms.push(item);
    write(STORAGE_ROOMS, rooms);
    hotelApi.createRoom(data).then(() => {}).catch(() => {});
    return item;
  },

  async updateRoom(id: string, data: Partial<Room>): Promise<Room | null> {
    const rooms = read<Room[]>(STORAGE_ROOMS, []);
    const idx = rooms.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    rooms[idx] = { ...rooms[idx], ...data };
    write(STORAGE_ROOMS, rooms);
    hotelApi.updateRoom(id, data).then(() => {}).catch(() => {});
    return rooms[idx];
  },

  async deleteRoom(id: string): Promise<boolean> {
    const rooms = read<Room[]>(STORAGE_ROOMS, []);
    const filtered = rooms.filter((r) => r.id !== id);
    if (filtered.length === rooms.length) return false;
    write(STORAGE_ROOMS, filtered);
    hotelApi.deleteRoom(id).then(() => {}).catch(() => {});
    return true;
  },

  /* Season Prices */
  async getPrices(): Promise<SeasonPrice[]> {
    hotelApi.getPrices().then((data) => write(STORAGE_PRICES, data)).catch(() => {});
    return read<SeasonPrice[]>(STORAGE_PRICES, []);
  },

  async getPricesByType(roomTypeId: string): Promise<SeasonPrice[]> {
    hotelApi.getPricesByType(roomTypeId).then((data) => write(STORAGE_PRICES, data)).catch(() => {});
    return read<SeasonPrice[]>(STORAGE_PRICES, []).filter((p) => p.roomTypeId === roomTypeId);
  },

  async upsertPrice(data: Omit<SeasonPrice, "id"> & { id?: string }): Promise<SeasonPrice> {
    const prices = read<SeasonPrice[]>(STORAGE_PRICES, []);
    if (data.id) {
      const idx = prices.findIndex((p) => p.id === data.id);
      if (idx !== -1) {
        prices[idx] = { ...prices[idx], ...data };
        write(STORAGE_PRICES, prices);
        hotelApi.upsertPrice(data).then(() => {}).catch(() => {});
        return prices[idx];
      }
    }
    const item: SeasonPrice = { id: nextId(), roomTypeId: data.roomTypeId, seasonName: data.seasonName, price: data.price };
    prices.push(item);
    write(STORAGE_PRICES, prices);
    hotelApi.upsertPrice(data).then(() => {}).catch(() => {});
    return item;
  },

  async deletePrice(id: string): Promise<boolean> {
    const prices = read<SeasonPrice[]>(STORAGE_PRICES, []);
    const filtered = prices.filter((p) => p.id !== id);
    if (filtered.length === prices.length) return false;
    write(STORAGE_PRICES, filtered);
    hotelApi.deletePrice(id).then(() => {}).catch(() => {});
    return true;
  },
};

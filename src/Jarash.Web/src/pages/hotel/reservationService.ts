import { hotelApi } from "@/lib/hotel-api";
import { logger } from "@/lib/logger";
import type { Reservation } from "./hotelTypes";

const STORAGE_KEY = "jarash_reservations";

const cache = { data: null as Reservation[] | null, ts: 0 };
const CACHE_TTL = 2000;

function read(): Reservation[] {
  if (cache.data && Date.now() - cache.ts < CACHE_TTL) return cache.data;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache.data = raw ? JSON.parse(raw) : [];
    cache.ts = Date.now();
    return cache.data;
  } catch {
    cache.data = [];
    cache.ts = Date.now();
    return [];
  }
}
function write(data: Reservation[]): void {
  cache.data = data;
  cache.ts = Date.now();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* */ }
}

let idCounter = Date.now();
function nextId(): string { return `res_${++idCounter}`; }

export const reservationService = {
  getAllLocal(): Reservation[] {
    return read();
  },

  getActiveLocal(): Reservation[] {
    return read().filter((r) => r.status === "active" || r.status === "checked-in");
  },

  async getAll(): Promise<Reservation[]> {
    hotelApi.getReservations().then((data) => write(data)).catch(() => {});
    return read();
  },

  async getById(id: string): Promise<Reservation | undefined> {
    hotelApi.getReservationById(id).then(() => {}).catch(() => {});
    return read().find((r) => r.id === id);
  },

  async getActive(): Promise<Reservation[]> {
    hotelApi.getActiveReservations().then((data) => write(data)).catch(() => {});
    return read().filter((r) => r.status === "active" || r.status === "checked-in");
  },

  async create(data: Omit<Reservation, "id" | "createdAt">): Promise<Reservation> {
    const reservations = read();
    const item: Reservation = { id: nextId(), createdAt: new Date().toISOString(), ...data };
    reservations.push(item);
    write(reservations);
    hotelApi.createReservation(data).then(() => {}).catch(() => {});
    return item;
  },

  async update(id: string, data: Partial<Reservation>): Promise<Reservation | null> {
    const reservations = read();
    const idx = reservations.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    reservations[idx] = { ...reservations[idx], ...data };
    write(reservations);
    hotelApi.updateReservation(id, data).then(() => {}).catch(() => {});
    return reservations[idx];
  },

  async cancel(id: string): Promise<boolean> {
    const reservations = read();
    const idx = reservations.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    reservations[idx] = { ...reservations[idx], status: "cancelled" };
    write(reservations);
    hotelApi.cancelReservation(id).then(() => {}).catch(() => {});
    return true;
  },

  async extendStay(id: string, newCheckOut: string): Promise<boolean> {
    const reservations = read();
    const idx = reservations.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    reservations[idx] = { ...reservations[idx], checkOut: newCheckOut };
    write(reservations);
    hotelApi.extendStay(id, newCheckOut).then(() => {}).catch(() => {});
    return true;
  },
};

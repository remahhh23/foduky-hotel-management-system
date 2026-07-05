import { hotelApi } from "@/lib/hotel-api";
import { logger } from "@/lib/logger";
import type { ServiceRequest, ServiceType } from "./hotelTypes";

const STORAGE_KEY = "jarash_service_requests";

function read(): ServiceRequest[] {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
}
function write(data: ServiceRequest[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* */ }
}

async function apiGet(fetcher: () => Promise<ServiceRequest[]>): Promise<ServiceRequest[]> {
  try { const data = await fetcher(); write(data); return data; }
  catch { return read(); }
}

let idCounter = Date.now();
function nextId(): string { return `srv_${++idCounter}`; }

export const servicesService = {
  getAllLocal(): ServiceRequest[] {
    return read();
  },

  async getByType(type: ServiceType): Promise<ServiceRequest[]> {
    try { return await hotelApi.getServiceRequestsByType(type); }
    catch { return read().filter((s) => s.serviceType === type); }
  },

  async getAll(): Promise<ServiceRequest[]> {
    return apiGet(() => hotelApi.getServiceRequests());
  },

  async create(data: Omit<ServiceRequest, "id" | "createdAt">): Promise<ServiceRequest> {
    try { return await hotelApi.createServiceRequest(data); }
    catch {
      const items = read();
      const item: ServiceRequest = { id: nextId(), createdAt: new Date().toISOString(), ...data };
      items.push(item);
      write(items);
      return item;
    }
  },

  async update(id: string, data: Partial<ServiceRequest>): Promise<ServiceRequest | null> {
    try { return await hotelApi.updateServiceRequest(id, data); }
    catch {
      const items = read();
      const idx = items.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      items[idx] = { ...items[idx], ...data };
      write(items);
      return items[idx];
    }
  },

  async delete(id: string): Promise<boolean> {
    try { await hotelApi.deleteServiceRequest(id); return true; }
    catch {
      const items = read();
      const filtered = items.filter((s) => s.id !== id);
      if (filtered.length === items.length) return false;
      write(filtered);
      return true;
    }
  },

  async complete(id: string): Promise<boolean> {
    try { await hotelApi.completeServiceRequest(id); return true; }
    catch {
      const items = read();
      const idx = items.findIndex((s) => s.id === id);
      if (idx === -1) return false;
      items[idx] = { ...items[idx], status: "completed" };
      write(items);
      return true;
    }
  },
};

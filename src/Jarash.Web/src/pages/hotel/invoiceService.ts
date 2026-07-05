import { hotelApi } from "@/lib/hotel-api";
import { logger } from "@/lib/logger";
import type { Invoice, InvoiceType } from "./hotelTypes";

const STORAGE_KEY = "jarash_invoices";

function read(): Invoice[] {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
}
function write(data: Invoice[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* */ }
}

async function apiGet(fetcher: () => Promise<Invoice[]>): Promise<Invoice[]> {
  try { const data = await fetcher(); write(data); return data; }
  catch { return read(); }
}

let idCounter = Date.now();
function nextId(): string { return `inv_${++idCounter}`; }

export const invoiceService = {
  getAllLocal(): Invoice[] {
    return read();
  },

  async getByType(type: InvoiceType): Promise<Invoice[]> {
    try { return await hotelApi.getInvoicesByType(type); }
    catch { return read().filter((i) => i.invoiceType === type); }
  },

  async getAll(): Promise<Invoice[]> {
    return apiGet(() => hotelApi.getInvoices());
  },

  async create(data: Omit<Invoice, "id" | "createdAt">): Promise<Invoice> {
    try { return await hotelApi.createInvoice(data); }
    catch {
      const items = read();
      const item: Invoice = { id: nextId(), createdAt: new Date().toISOString(), ...data };
      items.push(item);
      write(items);
      return item;
    }
  },

  async update(id: string, data: Partial<Invoice>): Promise<Invoice | null> {
    try { return await hotelApi.updateInvoice(id, data); }
    catch {
      const items = read();
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      items[idx] = { ...items[idx], ...data };
      write(items);
      return items[idx];
    }
  },

  async delete(id: string): Promise<boolean> {
    try { await hotelApi.deleteInvoice(id); return true; }
    catch {
      const items = read();
      const filtered = items.filter((i) => i.id !== id);
      if (filtered.length === items.length) return false;
      write(filtered);
      return true;
    }
  },
};

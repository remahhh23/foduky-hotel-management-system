import { logger } from "@/lib/logger";
import type { Account, Customer, CostCenter, JournalEntry } from "./accountsTypes";

const KEYS = {
  accounts: "jarash_accounts",
  customers: "jarash_customers",
  costCenters: "jarash_cost_centers",
  journalEntries: "jarash_journal_entries",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (err) {
    logger.error(`accountsService: read ${key} failed`, err);
    return fallback;
  }
}

function write<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    logger.error(`accountsService: write ${key} failed`, err);
  }
}

let idCounter = Date.now();
function nextId(prefix: string): string {
  return `${prefix}_${++idCounter}`;
}

/* ── Accounts ── */
export const accountService = {
  getAll(): Account[] {
    return read<Account[]>(KEYS.accounts, []);
  },

  getChildren(parentId: string | null): Account[] {
    return this.getAll().filter((a) => a.parentId === parentId);
  },

  create(data: Omit<Account, "id" | "createdAt">): Account {
    const items = this.getAll();
    const item: Account = { id: nextId("acc"), createdAt: new Date().toISOString(), ...data };
    items.push(item);
    write(KEYS.accounts, items);
    logger.info("accountService: created", { id: item.id, code: item.code, name: item.name });
    return item;
  },

  update(id: string, data: Partial<Account>): Account | null {
    const items = this.getAll();
    const idx = items.findIndex((a) => a.id === id);
    if (idx === -1) { logger.warn("accountService: update not found", { id }); return null; }
    items[idx] = { ...items[idx], ...data };
    write(KEYS.accounts, items);
    logger.info("accountService: updated", { id });
    return items[idx];
  },

  delete(id: string): boolean {
    const items = this.getAll();
    const hasChildren = items.some((a) => a.parentId === id);
    if (hasChildren) { logger.warn("accountService: delete has children", { id }); return false; }
    const filtered = items.filter((a) => a.id !== id);
    if (filtered.length === items.length) { logger.warn("accountService: delete not found", { id }); return false; }
    write(KEYS.accounts, filtered);
    logger.info("accountService: deleted", { id });
    return true;
  },
};

/* ── Customers ── */
export const customerService = {
  getAll(): Customer[] {
    return read<Customer[]>(KEYS.customers, []);
  },

  create(data: Omit<Customer, "id" | "createdAt">): Customer {
    const items = this.getAll();
    const item: Customer = { id: nextId("cust"), createdAt: new Date().toISOString(), ...data };
    items.push(item);
    write(KEYS.customers, items);
    logger.info("customerService: created", { id: item.id, name: item.name });
    return item;
  },

  update(id: string, data: Partial<Customer>): Customer | null {
    const items = this.getAll();
    const idx = items.findIndex((c) => c.id === id);
    if (idx === -1) { logger.warn("customerService: update not found", { id }); return null; }
    items[idx] = { ...items[idx], ...data };
    write(KEYS.customers, items);
    logger.info("customerService: updated", { id });
    return items[idx];
  },

  delete(id: string): boolean {
    const items = this.getAll();
    const filtered = items.filter((c) => c.id !== id);
    if (filtered.length === items.length) { logger.warn("customerService: delete not found", { id }); return false; }
    write(KEYS.customers, filtered);
    logger.info("customerService: deleted", { id });
    return true;
  },
};

/* ── Cost Centers ── */
export const costCenterService = {
  getAll(): CostCenter[] {
    return read<CostCenter[]>(KEYS.costCenters, []);
  },

  getChildren(parentId: string | null): CostCenter[] {
    return this.getAll().filter((c) => c.parentId === parentId);
  },

  create(data: Omit<CostCenter, "id" | "createdAt">): CostCenter {
    const items = this.getAll();
    const item: CostCenter = { id: nextId("cc"), createdAt: new Date().toISOString(), ...data };
    items.push(item);
    write(KEYS.costCenters, items);
    logger.info("costCenterService: created", { id: item.id, code: item.code, name: item.name });
    return item;
  },

  update(id: string, data: Partial<CostCenter>): CostCenter | null {
    const items = this.getAll();
    const idx = items.findIndex((c) => c.id === id);
    if (idx === -1) { logger.warn("costCenterService: update not found", { id }); return null; }
    items[idx] = { ...items[idx], ...data };
    write(KEYS.costCenters, items);
    logger.info("costCenterService: updated", { id });
    return items[idx];
  },

  delete(id: string): boolean {
    const items = this.getAll();
    const hasChildren = items.some((c) => c.parentId === id);
    if (hasChildren) { logger.warn("costCenterService: delete has children", { id }); return false; }
    const filtered = items.filter((c) => c.id !== id);
    if (filtered.length === items.length) { logger.warn("costCenterService: delete not found", { id }); return false; }
    write(KEYS.costCenters, filtered);
    logger.info("costCenterService: deleted", { id });
    return true;
  },
};

/* ── Journal Entries ── */
export const journalEntryService = {
  getAll(): JournalEntry[] {
    return read<JournalEntry[]>(KEYS.journalEntries, []);
  },

  getByStatus(status: string): JournalEntry[] {
    return this.getAll().filter((e) => e.status === status);
  },

  getById(id: string): JournalEntry | undefined {
    return this.getAll().find((e) => e.id === id);
  },

  create(data: Omit<JournalEntry, "id" | "createdAt" | "entryNumber" | "totalDebit" | "totalCredit">): JournalEntry {
    const items = this.getAll();
    const count = items.length + 1;
    const totalDebit = data.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = data.lines.reduce((s, l) => s + l.credit, 0);
    const item: JournalEntry = {
      id: nextId("je"),
      entryNumber: `JE-${count.toString().padStart(4, "0")}`,
      totalDebit, totalCredit,
      createdAt: new Date().toISOString(),
      ...data,
    };
    items.push(item);
    write(KEYS.journalEntries, items);
    logger.info("journalEntryService: created", { id: item.id, entryNumber: item.entryNumber });
    return item;
  },

  update(id: string, data: Partial<JournalEntry>): JournalEntry | null {
    const items = this.getAll();
    const idx = items.findIndex((e) => e.id === id);
    if (idx === -1) { logger.warn("journalEntryService: update not found", { id }); return null; }
    if (items[idx].status === "posted") { logger.warn("journalEntryService: cannot update posted entry", { id }); return null; }
    if (data.lines) {
      data.totalDebit = data.lines.reduce((s, l) => s + l.debit, 0);
      data.totalCredit = data.lines.reduce((s, l) => s + l.credit, 0);
    }
    items[idx] = { ...items[idx], ...data };
    write(KEYS.journalEntries, items);
    logger.info("journalEntryService: updated", { id });
    return items[idx];
  },

  post(id: string): boolean {
    const items = this.getAll();
    const idx = items.findIndex((e) => e.id === id);
    if (idx === -1) { logger.warn("journalEntryService: post not found", { id }); return false; }
    if (items[idx].status === "posted") { logger.warn("journalEntryService: already posted", { id }); return false; }
    if (items[idx].totalDebit !== items[idx].totalCredit) { logger.warn("journalEntryService: unbalanced entry", { id }); return false; }
    items[idx] = { ...items[idx], status: "posted" };
    write(KEYS.journalEntries, items);
    logger.info("journalEntryService: posted", { id });
    return true;
  },

  delete(id: string): boolean {
    const items = this.getAll();
    const idx = items.findIndex((e) => e.id === id);
    if (idx === -1) { logger.warn("journalEntryService: delete not found", { id }); return false; }
    if (items[idx].status === "posted") { logger.warn("journalEntryService: cannot delete posted entry", { id }); return false; }
    const filtered = items.filter((e) => e.id !== id);
    write(KEYS.journalEntries, filtered);
    logger.info("journalEntryService: deleted", { id });
    return true;
  },
};

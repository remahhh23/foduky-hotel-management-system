import { logger } from "@/lib/logger";
import type { Supplier, PurchaseOrder, PurchaseInvoice, PurchaseReturn, SupplierPayment } from "./purchasesTypes";

const KEYS = {
  suppliers: "jarash_suppliers",
  purchaseOrders: "jarash_purchase_orders",
  purchaseInvoices: "jarash_purchase_invoices",
  purchaseReturns: "jarash_purchase_returns",
  supplierPayments: "jarash_supplier_payments",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (err) {
    logger.error(`purchasesService: read ${key} failed`, err);
    return fallback;
  }
}

function write<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    logger.error(`purchasesService: write ${key} failed`, err);
  }
}

const COUNTER_KEY = "jarash_sequence_counter";

function getNextSequence(): number {
  const current = read<number>(COUNTER_KEY, 0);
  write(COUNTER_KEY, current + 1);
  return current + 1;
}

let idCounter = Date.now();
function nextId(prefix: string): string {
  return `${prefix}_${++idCounter}`;
}

/* ── Suppliers ── */
export const supplierService = {
  getAll(): Supplier[] {
    return read<Supplier[]>(KEYS.suppliers, []);
  },

  create(data: Omit<Supplier, "id" | "createdAt">): Supplier {
    const items = this.getAll();
    const item: Supplier = { id: nextId("sup"), createdAt: new Date().toISOString(), ...data };
    items.push(item);
    write(KEYS.suppliers, items);
    logger.info("supplierService: created", { id: item.id, name: item.name });
    return item;
  },

  update(id: string, data: Partial<Supplier>): Supplier | null {
    const items = this.getAll();
    const idx = items.findIndex((s) => s.id === id);
    if (idx === -1) { logger.warn("supplierService: update not found", { id }); return null; }
    items[idx] = { ...items[idx], ...data };
    write(KEYS.suppliers, items);
    logger.info("supplierService: updated", { id });
    return items[idx];
  },

  delete(id: string): boolean {
    const items = this.getAll();
    const filtered = items.filter((s) => s.id !== id);
    if (filtered.length === items.length) { logger.warn("supplierService: delete not found", { id }); return false; }
    write(KEYS.suppliers, filtered);
    logger.info("supplierService: deleted", { id });
    return true;
  },
};

/* ── Purchase Orders ── */
export const purchaseOrderService = {
  getAll(): PurchaseOrder[] {
    return read<PurchaseOrder[]>(KEYS.purchaseOrders, []);
  },

  getByStatus(status: string): PurchaseOrder[] {
    return this.getAll().filter((o) => o.status === status);
  },

  create(data: Omit<PurchaseOrder, "id" | "createdAt" | "orderNumber">): PurchaseOrder {
    const items = this.getAll();
    const seq = getNextSequence();
    const item: PurchaseOrder = { id: nextId("po"), orderNumber: `PO-${seq.toString().padStart(4, "0")}`, createdAt: new Date().toISOString(), ...data };
    items.push(item);
    write(KEYS.purchaseOrders, items);
    logger.info("purchaseOrderService: created", { id: item.id, orderNumber: item.orderNumber });
    return item;
  },

  update(id: string, data: Partial<PurchaseOrder>): PurchaseOrder | null {
    const items = this.getAll();
    const idx = items.findIndex((o) => o.id === id);
    if (idx === -1) { logger.warn("purchaseOrderService: update not found", { id }); return null; }
    items[idx] = { ...items[idx], ...data };
    write(KEYS.purchaseOrders, items);
    logger.info("purchaseOrderService: updated", { id });
    return items[idx];
  },

  approve(id: string): boolean {
    return this.update(id, { status: "approved" }) !== null;
  },

  cancel(id: string): boolean {
    return this.update(id, { status: "cancelled" }) !== null;
  },

  delete(id: string): boolean {
    const items = this.getAll();
    const filtered = items.filter((o) => o.id !== id);
    if (filtered.length === items.length) { logger.warn("purchaseOrderService: delete not found", { id }); return false; }
    write(KEYS.purchaseOrders, filtered);
    logger.info("purchaseOrderService: deleted", { id });
    return true;
  },
};

/* ── Purchase Invoices ── */
export const purchaseInvoiceService = {
  getAll(): PurchaseInvoice[] {
    return read<PurchaseInvoice[]>(KEYS.purchaseInvoices, []);
  },

  create(data: Omit<PurchaseInvoice, "id" | "createdAt" | "invoiceNumber">): PurchaseInvoice {
    const items = this.getAll();
    const seq = getNextSequence();
    const item: PurchaseInvoice = { id: nextId("inv"), invoiceNumber: `INV-${seq.toString().padStart(4, "0")}`, createdAt: new Date().toISOString(), ...data };
    items.push(item);
    write(KEYS.purchaseInvoices, items);
    logger.info("purchaseInvoiceService: created", { id: item.id, invoiceNumber: item.invoiceNumber });
    return item;
  },

  update(id: string, data: Partial<PurchaseInvoice>): PurchaseInvoice | null {
    const items = this.getAll();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) { logger.warn("purchaseInvoiceService: update not found", { id }); return null; }
    items[idx] = { ...items[idx], ...data };
    write(KEYS.purchaseInvoices, items);
    logger.info("purchaseInvoiceService: updated", { id });
    return items[idx];
  },

  delete(id: string): boolean {
    const items = this.getAll();
    const filtered = items.filter((i) => i.id !== id);
    if (filtered.length === items.length) { logger.warn("purchaseInvoiceService: delete not found", { id }); return false; }
    write(KEYS.purchaseInvoices, filtered);
    logger.info("purchaseInvoiceService: deleted", { id });
    return true;
  },
};

/* ── Purchase Returns ── */
export const purchaseReturnService = {
  getAll(): PurchaseReturn[] {
    return read<PurchaseReturn[]>(KEYS.purchaseReturns, []);
  },

  create(data: Omit<PurchaseReturn, "id" | "createdAt" | "returnNumber">): PurchaseReturn {
    const items = this.getAll();
    const seq = getNextSequence();
    const item: PurchaseReturn = { id: nextId("ret"), returnNumber: `RET-${seq.toString().padStart(4, "0")}`, createdAt: new Date().toISOString(), ...data };
    items.push(item);
    write(KEYS.purchaseReturns, items);
    logger.info("purchaseReturnService: created", { id: item.id, returnNumber: item.returnNumber });
    return item;
  },

  delete(id: string): boolean {
    const items = this.getAll();
    const filtered = items.filter((r) => r.id !== id);
    if (filtered.length === items.length) { logger.warn("purchaseReturnService: delete not found", { id }); return false; }
    write(KEYS.purchaseReturns, filtered);
    logger.info("purchaseReturnService: deleted", { id });
    return true;
  },
};

/* ── Supplier Payments ── */
export const supplierPaymentService = {
  getAll(): SupplierPayment[] {
    return read<SupplierPayment[]>(KEYS.supplierPayments, []);
  },

  getByType(type: string): SupplierPayment[] {
    return this.getAll().filter((p) => p.type === type);
  },

  create(data: Omit<SupplierPayment, "id" | "createdAt">): SupplierPayment {
    const items = this.getAll();
    const item: SupplierPayment = { id: nextId("pay"), createdAt: new Date().toISOString(), ...data };
    items.push(item);
    write(KEYS.supplierPayments, items);
    logger.info("supplierPaymentService: created", { id: item.id });
    return item;
  },

  update(id: string, data: Partial<SupplierPayment>): SupplierPayment | null {
    const items = this.getAll();
    const idx = items.findIndex((p) => p.id === id);
    if (idx === -1) { logger.warn("supplierPaymentService: update not found", { id }); return null; }
    items[idx] = { ...items[idx], ...data };
    write(KEYS.supplierPayments, items);
    logger.info("supplierPaymentService: updated", { id });
    return items[idx];
  },

  delete(id: string): boolean {
    const items = this.getAll();
    const filtered = items.filter((p) => p.id !== id);
    if (filtered.length === items.length) { logger.warn("supplierPaymentService: delete not found", { id }); return false; }
    write(KEYS.supplierPayments, filtered);
    logger.info("supplierPaymentService: deleted", { id });
    return true;
  },
};

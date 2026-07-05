import { logger } from "@/lib/logger";
import type { InventoryItem, InventoryMovement, InventoryCount, InventoryTransfer } from "./inventoryTypes";

const KEYS = {
  items: "jarash_inventory_items",
  movements: "jarash_inventory_movements",
  counts: "jarash_inventory_counts",
  transfers: "jarash_inventory_transfers",
} as const;

export const SYNC_KEYS = {
  categories: "jarash_inventory_categories",
  warehouses: "jarash_inventory_warehouses",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (err) {
    logger.error(`inventoryService: read ${key} failed`, err);
    return fallback;
  }
}

function write<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    logger.error(`inventoryService: write ${key} failed`, err);
  }
}

let idCounter = Date.now();
function nextId(prefix: string): string {
  return `${prefix}_${++idCounter}`;
}

const SEED_ITEMS: InventoryItem[] = [
  { id: "seed_i1", name: "مكيف سبليت 18 وحدة", sku: "AC-001", category: "أجهزة كهربائية", warehouse: "المستودع الرئيسي", quantity: 15, unitCost: 1800, sellingPrice: 2500, reorderLevel: 5, expiryDate: "", notes: "", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i2", name: "مكيف سبليت 24 وحدة", sku: "AC-002", category: "أجهزة كهربائية", warehouse: "المستودع الرئيسي", quantity: 8, unitCost: 2200, sellingPrice: 3100, reorderLevel: 3, expiryDate: "", notes: "", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i3", name: "مكيف شباك 12 وحدة", sku: "AC-003", category: "أجهزة كهربائية", warehouse: "المستودع الفرعي", quantity: 3, unitCost: 950, sellingPrice: 1400, reorderLevel: 5, expiryDate: "", notes: "", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i4", name: "مروحة سقف", sku: "FAN-001", category: "أجهزة كهربائية", warehouse: "المستودع الرئيسي", quantity: 22, unitCost: 320, sellingPrice: 550, reorderLevel: 10, expiryDate: "", notes: "", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i5", name: "مروحة أرضية", sku: "FAN-002", category: "أجهزة كهربائية", warehouse: "المستودع الفرعي", quantity: 7, unitCost: 180, sellingPrice: 300, reorderLevel: 5, expiryDate: "", notes: "", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i6", name: "لمبة LED 15 واط", sku: "LMP-001", category: "كهرباء", warehouse: "المستودع الرئيسي", quantity: 120, unitCost: 12, sellingPrice: 25, reorderLevel: 50, expiryDate: "", notes: "", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i7", name: "لمبة LED 25 واط", sku: "LMP-002", category: "كهرباء", warehouse: "المستودع الرئيسي", quantity: 85, unitCost: 18, sellingPrice: 35, reorderLevel: 40, expiryDate: "", notes: "", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i8", name: "مفتاح كهرباء دبل", sku: "SW-001", category: "كهرباء", warehouse: "المستودع الرئيسي", quantity: 60, unitCost: 8, sellingPrice: 15, reorderLevel: 30, expiryDate: "", notes: "", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i9", name: "مفتاح كهرباء فريدة", sku: "SW-002", category: "كهرباء", warehouse: "المستودع الفرعي", quantity: 45, unitCost: 6, sellingPrice: 12, reorderLevel: 25, expiryDate: "", notes: "", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i10", name: "أفياش كهرباء", sku: "OUT-001", category: "كهرباء", warehouse: "المستودع الرئيسي", quantity: 95, unitCost: 5, sellingPrice: 10, reorderLevel: 40, expiryDate: "", notes: "", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i11", name: "سلك كهرباء 4 مم", sku: "WIRE-001", category: "كهرباء", warehouse: "المستودع الرئيسي", quantity: 500, unitCost: 1.5, sellingPrice: 3, reorderLevel: 200, expiryDate: "", notes: "متر", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i12", name: "صنبور حوض", sku: "PLM-001", category: "سباكة", warehouse: "المستودع الرئيسي", quantity: 25, unitCost: 85, sellingPrice: 150, reorderLevel: 10, expiryDate: "", notes: "", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i13", name: "صنبور مطبخ", sku: "PLM-002", category: "سباكة", warehouse: "المستودع الرئيسي", quantity: 18, unitCost: 120, sellingPrice: 200, reorderLevel: 8, expiryDate: "", notes: "", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i14", name: "مواسير بلاستيك 4 إنش", sku: "PLM-003", category: "سباكة", warehouse: "المستودع الرئيسي", quantity: 60, unitCost: 25, sellingPrice: 45, reorderLevel: 30, expiryDate: "", notes: "قطعة", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i15", name: "صمولة إصلاح 20 مم", sku: "PLM-004", category: "سباكة", warehouse: "المستودع الفرعي", quantity: 2, unitCost: 3, sellingPrice: 8, reorderLevel: 20, expiryDate: "", notes: "", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i16", name: "دهان جدار أبيض 20 لتر", sku: "PNT-001", category: "دهان", warehouse: "المستودع الرئيسي", quantity: 12, unitCost: 180, sellingPrice: 300, reorderLevel: 5, expiryDate: "2027-06-01", notes: "", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i17", name: "دهان جدار بيج 20 لتر", sku: "PNT-002", category: "دهان", warehouse: "المستودع الرئيسي", quantity: 6, unitCost: 190, sellingPrice: 310, reorderLevel: 3, expiryDate: "2027-04-01", notes: "", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i18", name: "معجون جدران 5 كجم", sku: "PNT-003", category: "دهان", warehouse: "المستودع الفرعي", quantity: 20, unitCost: 35, sellingPrice: 65, reorderLevel: 10, expiryDate: "2026-12-01", notes: "", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i19", name: "بلاط سيراميك 40×40", sku: "TIL-001", category: "بناء", warehouse: "المستودع الرئيسي", quantity: 200, unitCost: 25, sellingPrice: 45, reorderLevel: 100, expiryDate: "", notes: "متر مربع", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i20", name: "اسمنت عادي 50 كجم", sku: "CMT-001", category: "بناء", warehouse: "المستودع الرئيسي", quantity: 0, unitCost: 55, sellingPrice: 90, reorderLevel: 30, expiryDate: "2026-08-01", notes: "كيس", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i21", name: "مسمار خشاب 3 إنش", sku: "NAIL-001", category: "عدد ومواد", warehouse: "المستودع الرئيسي", quantity: 800, unitCost: 0.5, sellingPrice: 1, reorderLevel: 500, expiryDate: "", notes: "قطعة", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i22", name: "شريط لاصق كهربائي", sku: "TAPE-001", category: "عدد ومواد", warehouse: "المستودع الرئيسي", quantity: 35, unitCost: 3, sellingPrice: 7, reorderLevel: 20, expiryDate: "", notes: "", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i23", name: "يد باب نحاس", sku: "HDW-001", category: "عدد ومواد", warehouse: "المستودع الرئيسي", quantity: 4, unitCost: 45, sellingPrice: 80, reorderLevel: 10, expiryDate: "", notes: "", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i24", name: "منظف زجاج 1 لتر", sku: "CLN-001", category: "مواد تنظيف", warehouse: "المستودع الرئيسي", quantity: 2, unitCost: 15, sellingPrice: 30, reorderLevel: 15, expiryDate: "2026-09-01", notes: "", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i25", name: "مطهر أرضيات 1 لتر", sku: "CLN-002", category: "مواد تنظيف", warehouse: "المستودع الرئيسي", quantity: 1, unitCost: 12, sellingPrice: 25, reorderLevel: 20, expiryDate: "2026-10-01", notes: "", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i26", name: "معطر جو سبراي", sku: "CLN-003", category: "مواد تنظيف", warehouse: "المستودع الفرعي", quantity: 10, unitCost: 8, sellingPrice: 18, reorderLevel: 15, expiryDate: "2026-11-01", notes: "", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i27", name: "مسحوق غسيل 3 كجم", sku: "CLN-004", category: "مواد تنظيف", warehouse: "المستودع الرئيسي", quantity: 0, unitCost: 22, sellingPrice: 45, reorderLevel: 15, expiryDate: "2027-01-01", notes: "", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i28", name: "مناديل ورق كبيرة", sku: "PAP-001", category: "مواد تنظيف", warehouse: "المستودع الرئيسي", quantity: 5, unitCost: 10, sellingPrice: 22, reorderLevel: 20, expiryDate: "2027-03-01", notes: "ربطة", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i29", name: "أكياس نفايات 50 لتر", sku: "BAG-001", category: "مواد تنظيف", warehouse: "المستودع الرئيسي", quantity: 30, unitCost: 6, sellingPrice: 15, reorderLevel: 20, expiryDate: "", notes: "ربطة", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "seed_i30", name: "خرقة تنظيف", sku: "RAG-001", category: "مواد تنظيف", warehouse: "المستودع الرئيسي", quantity: 40, unitCost: 3, sellingPrice: 7, reorderLevel: 25, expiryDate: "", notes: "قطعة", createdAt: "2026-01-01T00:00:00.000Z" },
];

const SEED_MOVEMENTS: InventoryMovement[] = [
  { id: "seed_m1", itemId: "seed_i1", itemName: "مكيف سبليت 18 وحدة", type: "purchase_in", quantity: 20, unitCost: 1800, reference: "PO-0001", notes: "", date: "2026-01-05", createdAt: "2026-01-05T00:00:00.000Z" },
  { id: "seed_m2", itemId: "seed_i1", itemName: "مكيف سبليت 18 وحدة", type: "sale_out", quantity: 5, unitCost: 1800, reference: "INV-001", notes: "غرف الفندق", date: "2026-01-15", createdAt: "2026-01-15T00:00:00.000Z" },
  { id: "seed_m3", itemId: "seed_i2", itemName: "مكيف سبليت 24 وحدة", type: "purchase_in", quantity: 10, unitCost: 2200, reference: "PO-0002", notes: "", date: "2026-01-10", createdAt: "2026-01-10T00:00:00.000Z" },
  { id: "seed_m4", itemId: "seed_i2", itemName: "مكيف سبليت 24 وحدة", type: "sale_out", quantity: 2, unitCost: 2200, reference: "INV-002", notes: "الصالة الكبرى", date: "2026-02-01", createdAt: "2026-02-01T00:00:00.000Z" },
  { id: "seed_m5", itemId: "seed_i4", itemName: "مروحة سقف", type: "purchase_in", quantity: 30, unitCost: 320, reference: "PO-0003", notes: "", date: "2026-01-20", createdAt: "2026-01-20T00:00:00.000Z" },
  { id: "seed_m6", itemId: "seed_i4", itemName: "مروحة سقف", type: "sale_out", quantity: 8, unitCost: 320, reference: "INV-003", notes: "غرف الفندق", date: "2026-02-10", createdAt: "2026-02-10T00:00:00.000Z" },
  { id: "seed_m7", itemId: "seed_i6", itemName: "لمبة LED 15 واط", type: "purchase_in", quantity: 200, unitCost: 12, reference: "PO-0004", notes: "", date: "2026-01-25", createdAt: "2026-01-25T00:00:00.000Z" },
  { id: "seed_m8", itemId: "seed_i6", itemName: "لمبة LED 15 واط", type: "sale_out", quantity: 80, unitCost: 12, reference: "INV-004", notes: "صيانة الغرف", date: "2026-02-15", createdAt: "2026-02-15T00:00:00.000Z" },
  { id: "seed_m9", itemId: "seed_i12", itemName: "صنبور حوض", type: "purchase_in", quantity: 30, unitCost: 85, reference: "PO-0005", notes: "", date: "2026-01-15", createdAt: "2026-01-15T00:00:00.000Z" },
  { id: "seed_m10", itemId: "seed_i12", itemName: "صنبور حوض", type: "sale_out", quantity: 5, unitCost: 85, reference: "INV-005", notes: "صيانة الحمامات", date: "2026-02-20", createdAt: "2026-02-20T00:00:00.000Z" },
  { id: "seed_m11", itemId: "seed_i16", itemName: "دهان جدار أبيض 20 لتر", type: "purchase_in", quantity: 15, unitCost: 180, reference: "PO-0006", notes: "", date: "2026-01-10", createdAt: "2026-01-10T00:00:00.000Z" },
  { id: "seed_m12", itemId: "seed_i16", itemName: "دهان جدار أبيض 20 لتر", type: "sale_out", quantity: 3, unitCost: 180, reference: "INV-006", notes: "دهان الممرات", date: "2026-02-05", createdAt: "2026-02-05T00:00:00.000Z" },
  { id: "seed_m13", itemId: "seed_i15", itemName: "صمولة إصلاح 20 مم", type: "purchase_in", quantity: 50, unitCost: 3, reference: "PO-0007", notes: "", date: "2026-01-05", createdAt: "2026-01-05T00:00:00.000Z" },
  { id: "seed_m14", itemId: "seed_i15", itemName: "صمولة إصلاح 20 مم", type: "sale_out", quantity: 48, unitCost: 3, reference: "INV-007", notes: "صيانة الحمامات", date: "2026-03-01", createdAt: "2026-03-01T00:00:00.000Z" },
  { id: "seed_m15", itemId: "seed_i20", itemName: "اسمنت عادي 50 كجم", type: "purchase_in", quantity: 50, unitCost: 55, reference: "PO-0008", notes: "", date: "2026-01-20", createdAt: "2026-01-20T00:00:00.000Z" },
  { id: "seed_m16", itemId: "seed_i20", itemName: "اسمنت عادي 50 كجم", type: "sale_out", quantity: 50, unitCost: 55, reference: "INV-008", notes: "صيانة المسبح", date: "2026-04-01", createdAt: "2026-04-01T00:00:00.000Z" },
  { id: "seed_m17", itemId: "seed_i24", itemName: "منظف زجاج 1 لتر", type: "purchase_in", quantity: 20, unitCost: 15, reference: "PO-0009", notes: "", date: "2026-02-01", createdAt: "2026-02-01T00:00:00.000Z" },
  { id: "seed_m18", itemId: "seed_i24", itemName: "منظف زجاج 1 لتر", type: "sale_out", quantity: 18, unitCost: 15, reference: "INV-009", notes: "خدمة التنظيف", date: "2026-03-15", createdAt: "2026-03-15T00:00:00.000Z" },
  { id: "seed_m19", itemId: "seed_i25", itemName: "مطهر أرضيات 1 لتر", type: "purchase_in", quantity: 30, unitCost: 12, reference: "PO-0010", notes: "", date: "2026-01-25", createdAt: "2026-01-25T00:00:00.000Z" },
  { id: "seed_m20", itemId: "seed_i25", itemName: "مطهر أرضيات 1 لتر", type: "sale_out", quantity: 29, unitCost: 12, reference: "INV-010", notes: "التنظيف اليومي", date: "2026-04-10", createdAt: "2026-04-10T00:00:00.000Z" },
  { id: "seed_m21", itemId: "seed_i3", itemName: "مكيف شباك 12 وحدة", type: "transfer_in", quantity: 5, unitCost: 950, reference: "TR-001", notes: "من المستودع الرئيسي", date: "2026-01-20", createdAt: "2026-01-20T00:00:00.000Z" },
  { id: "seed_m22", itemId: "seed_i27", itemName: "مسحوق غسيل 3 كجم", type: "purchase_in", quantity: 25, unitCost: 22, reference: "PO-0011", notes: "", date: "2026-01-10", createdAt: "2026-01-10T00:00:00.000Z" },
  { id: "seed_m23", itemId: "seed_i27", itemName: "مسحوق غسيل 3 كجم", type: "sale_out", quantity: 25, unitCost: 22, reference: "INV-011", notes: "المغسلة", date: "2026-05-01", createdAt: "2026-05-01T00:00:00.000Z" },
  { id: "seed_m24", itemId: "seed_i28", itemName: "مناديل ورق كبيرة", type: "purchase_in", quantity: 50, unitCost: 10, reference: "PO-0012", notes: "", date: "2026-01-05", createdAt: "2026-01-05T00:00:00.000Z" },
  { id: "seed_m25", itemId: "seed_i28", itemName: "مناديل ورق كبيرة", type: "sale_out", quantity: 45, unitCost: 10, reference: "INV-012", notes: "الاستخدام اليومي", date: "2026-03-20", createdAt: "2026-03-20T00:00:00.000Z" },
];

const SEED_COUNTS: InventoryCount[] = [
  { id: "seed_c1", itemId: "seed_i1", itemName: "مكيف سبليت 18 وحدة", warehouse: "المستودع الرئيسي", expectedQty: 15, actualQty: 15, difference: 0, notes: "", date: "2026-03-01", createdAt: "2026-03-01T00:00:00.000Z" },
  { id: "seed_c2", itemId: "seed_i4", itemName: "مروحة سقف", warehouse: "المستودع الرئيسي", expectedQty: 22, actualQty: 21, difference: -1, notes: "كسر واحد", date: "2026-03-01", createdAt: "2026-03-01T00:00:00.000Z" },
  { id: "seed_c3", itemId: "seed_i6", itemName: "لمبة LED 15 واط", warehouse: "المستودع الرئيسي", expectedQty: 120, actualQty: 120, difference: 0, notes: "", date: "2026-03-01", createdAt: "2026-03-01T00:00:00.000Z" },
  { id: "seed_c4", itemId: "seed_i12", itemName: "صنبور حوض", warehouse: "المستودع الرئيسي", expectedQty: 25, actualQty: 24, difference: -1, notes: "عيب تصنيع", date: "2026-04-01", createdAt: "2026-04-01T00:00:00.000Z" },
  { id: "seed_c5", itemId: "seed_i23", itemName: "يد باب نحاس", warehouse: "المستودع الرئيسي", expectedQty: 4, actualQty: 4, difference: 0, notes: "", date: "2026-04-01", createdAt: "2026-04-01T00:00:00.000Z" },
];

const SEED_TRANSFERS: InventoryTransfer[] = [
  { id: "seed_t1", itemId: "seed_i3", itemName: "مكيف شباك 12 وحدة", quantity: 5, fromWarehouse: "المستودع الرئيسي", toWarehouse: "المستودع الفرعي", reference: "TR-001", notes: "نقل للصيانة", date: "2026-01-20", createdAt: "2026-01-20T00:00:00.000Z" },
  { id: "seed_t2", itemId: "seed_i5", itemName: "مروحة أرضية", quantity: 3, fromWarehouse: "المستودع الرئيسي", toWarehouse: "المستودع الفرعي", reference: "TR-002", notes: "", date: "2026-02-15", createdAt: "2026-02-15T00:00:00.000Z" },
  { id: "seed_t3", itemId: "seed_i18", itemName: "معجون جدران 5 كجم", quantity: 5, fromWarehouse: "المستودع الرئيسي", toWarehouse: "المستودع الفرعي", reference: "TR-003", notes: "لمشروع الدهان", date: "2026-03-01", createdAt: "2026-03-01T00:00:00.000Z" },
];

function seed<T>(key: string, data: T): void {
  if (!localStorage.getItem(key)) {
    write(key, data);
    logger.info(`inventoryService: seeded ${key}`);
  }
}

seed(KEYS.items, SEED_ITEMS);
seed(KEYS.movements, SEED_MOVEMENTS);
seed(KEYS.counts, SEED_COUNTS);
seed(KEYS.transfers, SEED_TRANSFERS);

export const inventoryItemService = {
  getAll(): InventoryItem[] {
    return read<InventoryItem[]>(KEYS.items, []);
  },

  getById(id: string): InventoryItem | undefined {
    return this.getAll().find((i) => i.id === id);
  },

  getByWarehouse(warehouse: string): InventoryItem[] {
    return this.getAll().filter((i) => i.warehouse === warehouse);
  },

  getLowStock(): InventoryItem[] {
    return this.getAll().filter((i) => i.quantity > 0 && i.quantity <= i.reorderLevel);
  },

  getOutOfStock(): InventoryItem[] {
    return this.getAll().filter((i) => i.quantity <= 0);
  },

  getExpiring(before: string): InventoryItem[] {
    return this.getAll().filter((i) => i.expiryDate && i.expiryDate <= before);
  },

  getCategories(): string[] {
    const fromItems = new Set(this.getAll().map((i) => i.category));
    const stored: string[] = read(SYNC_KEYS.categories, []);
    stored.forEach((c) => fromItems.add(c));
    return Array.from(fromItems).sort();
  },

  syncCategoryCreated(name: string): void {
    const stored: string[] = read(SYNC_KEYS.categories, []);
    if (!stored.includes(name)) {
      stored.push(name);
      stored.sort();
      write(SYNC_KEYS.categories, stored);
    }
  },

  syncCategoryDeleted(name: string): void {
    const stored: string[] = read(SYNC_KEYS.categories, []);
    const filtered = stored.filter((c) => c !== name);
    write(SYNC_KEYS.categories, filtered);
    const items = this.getAll();
    let changed = false;
    const updated = items.map((i) => {
      if (i.category === name) { changed = true; return { ...i, category: "" }; }
      return i;
    });
    if (changed) write(KEYS.items, updated);
  },

  getWarehouses(): string[] {
    const fromItems = new Set(this.getAll().map((i) => i.warehouse));
    const raw: unknown[] = read(SYNC_KEYS.warehouses, []);
    for (const w of raw) {
      if (typeof w === "string") fromItems.add(w);
      else if (w && typeof w === "object" && "name" in (w as Record<string, unknown>)) fromItems.add((w as Record<string, string>).name);
    }
    return Array.from(fromItems).sort();
  },

  syncWarehouseCreated(name: string): void {
    const raw: unknown[] = read(SYNC_KEYS.warehouses, []);
    const names = raw.map((w) => typeof w === "string" ? w : (w as Record<string, string>).name);
    if (!names.includes(name)) {
      raw.push(name);
      write(SYNC_KEYS.warehouses, raw);
    }
  },

  syncWarehouseDeleted(name: string): void {
    const raw: unknown[] = read(SYNC_KEYS.warehouses, []);
    const filtered = raw.filter((w) => {
      const n = typeof w === "string" ? w : (w as Record<string, string>).name;
      return n !== name;
    });
    write(SYNC_KEYS.warehouses, filtered);
    const items = this.getAll();
    let changed = false;
    const updated = items.map((i) => {
      if (i.warehouse === name) { changed = true; return { ...i, warehouse: "" }; }
      return i;
    });
    if (changed) write(KEYS.items, updated);
  },

  create(data: Omit<InventoryItem, "id" | "createdAt">): InventoryItem {
    const items = this.getAll();
    const item: InventoryItem = { id: nextId("item"), createdAt: new Date().toISOString(), ...data };
    items.push(item);
    write(KEYS.items, items);
    logger.info("inventoryItemService: created", { id: item.id, name: item.name });
    return item;
  },

  update(id: string, data: Partial<InventoryItem>): InventoryItem | null {
    const items = this.getAll();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) { logger.warn("inventoryItemService: update not found", { id }); return null; }
    items[idx] = { ...items[idx], ...data };
    write(KEYS.items, items);
    logger.info("inventoryItemService: updated", { id });
    return items[idx];
  },

  updateQuantity(id: string, delta: number): boolean {
    const item = this.getById(id);
    if (!item) return false;
    return this.update(id, { quantity: item.quantity + delta }) !== null;
  },
};

export const inventoryMovementService = {
  getAll(): InventoryMovement[] {
    return read<InventoryMovement[]>(KEYS.movements, []);
  },

  getByItem(itemId: string): InventoryMovement[] {
    return this.getAll().filter((m) => m.itemId === itemId).sort((a, b) => a.date.localeCompare(b.date));
  },

  getByType(type: string): InventoryMovement[] {
    return this.getAll().filter((m) => m.type === type);
  },

  create(data: Omit<InventoryMovement, "id" | "createdAt">): InventoryMovement {
    const items = this.getAll();
    const item: InventoryMovement = { id: nextId("mov"), createdAt: new Date().toISOString(), ...data };
    items.push(item);
    write(KEYS.movements, items);
    logger.info("inventoryMovementService: created", { id: item.id, itemName: item.itemName });
    return item;
  },
};

export const inventoryCountService = {
  getAll(): InventoryCount[] {
    return read<InventoryCount[]>(KEYS.counts, []);
  },

  create(data: Omit<InventoryCount, "id" | "createdAt">): InventoryCount {
    const items = this.getAll();
    const item: InventoryCount = { id: nextId("cnt"), createdAt: new Date().toISOString(), ...data };
    items.push(item);
    write(KEYS.counts, items);
    logger.info("inventoryCountService: created", { id: item.id, itemName: item.itemName });
    return item;
  },
};

export const inventoryTransferService = {
  getAll(): InventoryTransfer[] {
    return read<InventoryTransfer[]>(KEYS.transfers, []);
  },

  create(data: Omit<InventoryTransfer, "id" | "createdAt">): InventoryTransfer {
    const items = this.getAll();
    const item: InventoryTransfer = { id: nextId("tr"), createdAt: new Date().toISOString(), ...data };
    items.push(item);
    write(KEYS.transfers, items);
    logger.info("inventoryTransferService: created", { id: item.id });
    return item;
  },
};

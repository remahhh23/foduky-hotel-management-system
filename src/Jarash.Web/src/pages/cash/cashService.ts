import { logger } from "@/lib/logger";
import type { CashFund, CashTransaction, VoucherType } from "./cashTypes";

const KEYS = {
  funds: "jarash_cash_funds",
  transactions: "jarash_cash_transactions",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (err) {
    logger.error(`cashService: read ${key} failed`, err);
    return fallback;
  }
}

function write<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    logger.error(`cashService: write ${key} failed`, err);
  }
}

let idCounter = Date.now();
function nextId(prefix: string): string {
  return `${prefix}_${++idCounter}`;
}

/* ── Funds ── */
export const cashFundService = {
  getAll(): CashFund[] {
    return read<CashFund[]>(KEYS.funds, []);
  },

  getOpen(): CashFund[] {
    return this.getAll().filter((f) => f.status === "open");
  },

  getById(id: string): CashFund | undefined {
    return this.getAll().find((f) => f.id === id);
  },

  open(data: Omit<CashFund, "id" | "createdAt" | "closedAt" | "currentBalance">): CashFund {
    const items = this.getAll();
    const item: CashFund = {
      id: nextId("fund"),
      currentBalance: data.initialBalance,
      closedAt: "",
      createdAt: new Date().toISOString(),
      ...data,
    };
    items.push(item);

    if (item.initialBalance > 0) {
      const txns = read<CashTransaction[]>(KEYS.transactions, []);
      txns.push({
        id: nextId("txn"),
        fundId: item.id,
        fundName: item.name,
        type: "receipt",
        amount: item.initialBalance,
        description: "رصيد افتتاحي",
        reference: "",
        counterparty: "",
        notes: "",
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      });
      write(KEYS.transactions, txns);
    }

    write(KEYS.funds, items);
    logger.info("cashFundService: opened", { id: item.id, name: item.name });
    return item;
  },

  close(id: string): CashFund | null {
    const items = this.getAll();
    const idx = items.findIndex((f) => f.id === id);
    if (idx === -1) { logger.warn("cashFundService: close not found", { id }); return null; }
    items[idx] = { ...items[idx], status: "closed", closedAt: new Date().toISOString() };
    write(KEYS.funds, items);
    logger.info("cashFundService: closed", { id });
    return items[idx];
  },

  updateBalance(id: string, delta: number): CashFund | null {
    const items = this.getAll();
    const idx = items.findIndex((f) => f.id === id);
    if (idx === -1) { logger.warn("cashFundService: updateBalance not found", { id }); return null; }
    items[idx] = { ...items[idx], currentBalance: items[idx].currentBalance + delta };
    write(KEYS.funds, items);
    return items[idx];
  },
};

/* ── Transactions ── */
export const cashTransactionService = {
  getAll(): CashTransaction[] {
    return read<CashTransaction[]>(KEYS.transactions, []);
  },

  getByFund(fundId: string): CashTransaction[] {
    return this.getAll().filter((t) => t.fundId === fundId);
  },

  getByType(type: string): CashTransaction[] {
    return this.getAll().filter((t) => t.type === type);
  },

  create(data: Omit<CashTransaction, "id" | "createdAt">): CashTransaction {
    const items = this.getAll();
    const item: CashTransaction = { id: nextId("txn"), createdAt: new Date().toISOString(), ...data };
    items.push(item);
    write(KEYS.transactions, items);

    const delta = data.type === "receipt" || data.type === "receiving" || data.type === "transfer_in"
      ? data.amount
      : data.type === "transfer_out"
        ? -data.amount
        : -data.amount;
    cashFundService.updateBalance(data.fundId, delta);

    logger.info("cashTransactionService: created", { id: item.id, type: item.type, amount: item.amount });
    return item;
  },

  delete(id: string): boolean {
    const items = this.getAll();
    const txn = items.find((t) => t.id === id);
    if (!txn) { logger.warn("cashTransactionService: delete not found", { id }); return false; }
    const filtered = items.filter((t) => t.id !== id);
    write(KEYS.transactions, filtered);

    const delta = txn.type === "receipt" || txn.type === "receiving" || txn.type === "transfer_in"
      ? -txn.amount
      : txn.amount;
    cashFundService.updateBalance(txn.fundId, delta);

    logger.info("cashTransactionService: deleted", { id });
    return true;
  },
};

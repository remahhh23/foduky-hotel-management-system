export interface CashFund {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  status: "open" | "closed";
  openedAt: string;
  closedAt: string;
  notes: string;
  createdAt: string;
}

export const FUND_STATUS_LABELS: Record<string, string> = {
  open: "مفتوح",
  closed: "مغلق",
};

export const FUND_STATUS_COLORS: Record<string, string> = {
  open: "text-green-500 bg-green-500/10",
  closed: "text-slate-500 bg-slate-500/10",
};

export type VoucherType = "receipt" | "payment" | "exchange" | "receiving";

export const VOUCHER_TYPE_LABELS: Record<VoucherType, string> = {
  receipt: "سند قبض",
  payment: "سند دفع",
  exchange: "سند صرف",
  receiving: "سند استلام",
};

export const VOUCHER_TYPE_COLORS: Record<VoucherType, string> = {
  receipt: "text-green-500 bg-green-500/10",
  payment: "text-red-500 bg-red-500/10",
  exchange: "text-amber-500 bg-amber-500/10",
  receiving: "text-blue-500 bg-blue-500/10",
};

export interface CashTransaction {
  id: string;
  fundId: string;
  fundName: string;
  type: VoucherType | "transfer_in" | "transfer_out";
  amount: number;
  description: string;
  reference: string;
  counterparty: string;
  notes: string;
  date: string;
  createdAt: string;
}

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  receipt: "سند قبض",
  payment: "سند دفع",
  exchange: "سند صرف",
  receiving: "سند استلام",
  transfer_in: "تحويل وارد",
  transfer_out: "تحويل صادر",
};

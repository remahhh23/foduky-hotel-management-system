export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  asset: "أصل",
  liability: "خصم",
  equity: "حقوق ملكية",
  income: "إيراد",
  expense: "مصروف",
};

export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  asset: "text-blue-500 bg-blue-500/10",
  liability: "text-red-500 bg-red-500/10",
  equity: "text-green-500 bg-green-500/10",
  income: "text-emerald-500 bg-emerald-500/10",
  expense: "text-amber-500 bg-amber-500/10",
};

export interface Account {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  type: AccountType;
  level: number;
  isActive: boolean;
  notes: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  creditLimit: number;
  notes: string;
  createdAt: string;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  level: number;
  notes: string;
  createdAt: string;
}

export interface JournalEntryLine {
  id: string;
  accountId: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

export type JournalEntryStatus = "draft" | "posted";

export const JOURNAL_ENTRY_STATUS_LABELS: Record<JournalEntryStatus, string> = {
  draft: "مسودة",
  posted: "مرحل",
};

export const JOURNAL_ENTRY_STATUS_COLORS: Record<JournalEntryStatus, string> = {
  draft: "text-amber-500 bg-amber-500/10",
  posted: "text-green-500 bg-green-500/10",
};

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  memo: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  status: JournalEntryStatus;
  createdAt: string;
}

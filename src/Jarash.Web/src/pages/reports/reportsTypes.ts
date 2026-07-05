export interface ReportAccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  level: number;
  debit: number;
  credit: number;
  balance: number;
}

export interface BalanceSheetRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  level: number;
  balance: number;
}

export interface BalanceSheetData {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  assets: BalanceSheetRow[];
  liabilities: BalanceSheetRow[];
  equity: BalanceSheetRow[];
}

export interface IncomeStatementRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  level: number;
  balance: number;
}

export interface IncomeStatementData {
  totalRevenue: number;
  totalExpense: number;
  netIncome: number;
  revenues: IncomeStatementRow[];
  expenses: IncomeStatementRow[];
}

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
}

export interface TrialBalanceData {
  totalDebit: number;
  totalCredit: number;
  rows: TrialBalanceRow[];
}

export interface GeneralLedgerRow {
  date: string;
  entryNumber: string;
  memo: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface GeneralLedgerData {
  accountName: string;
  accountCode: string;
  openingBalance: number;
  rows: GeneralLedgerRow[];
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}

export interface GeneralJournalRow {
  date: string;
  entryNumber: string;
  memo: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

export interface AccountMovementRow {
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface AccountStatementRow {
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface AgingBucket {
  label: string;
  fromDays: number;
  toDays: number;
  total: number;
  items: AgingItem[];
}

export interface AgingItem {
  name: string;
  amount: number;
  daysOverdue: number;
  reference: string;
  date: string;
}

export interface CashFlowRow {
  date: string;
  description: string;
  fundName: string;
  inflow: number;
  outflow: number;
}

export interface CashFlowData {
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  rows: CashFlowRow[];
}

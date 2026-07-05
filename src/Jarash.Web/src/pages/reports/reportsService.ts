import { logger } from "@/lib/logger";
import { accountService } from "@/pages/accounts/accountsService";
import { journalEntryService } from "@/pages/accounts/accountsService";
import { cashTransactionService } from "@/pages/cash/cashService";
import { purchaseInvoiceService, supplierPaymentService } from "@/pages/purchases/purchasesService";
import { invoiceService } from "@/pages/hotel/invoiceService";
import type { Account, JournalEntry, JournalEntryLine } from "@/pages/accounts/accountsTypes";
import type { CashTransaction } from "@/pages/cash/cashTypes";
import type {
  ReportAccountBalance,
  BalanceSheetData,
  IncomeStatementData,
  TrialBalanceData,
  GeneralLedgerData,
  GeneralJournalRow,
  AccountMovementRow,
  AgingBucket,
  CashFlowRow,
} from "./reportsTypes";

function getPostedEntries(): JournalEntry[] {
  return journalEntryService.getAll().filter((e) => e.status === "posted");
}

function computeAccountBalances(entries: JournalEntry[]): Map<string, ReportAccountBalance> {
  const accounts = accountService.getAll();
  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const balanceMap = new Map<string, { debit: number; credit: number }>();

  for (const entry of entries) {
    for (const line of entry.lines) {
      const key = line.accountId;
      if (!balanceMap.has(key)) balanceMap.set(key, { debit: 0, credit: 0 });
      const b = balanceMap.get(key)!;
      b.debit += line.debit;
      b.credit += line.credit;
    }
  }

  const result = new Map<string, ReportAccountBalance>();
  for (const [accountId, totals] of balanceMap) {
    const acct = accountMap.get(accountId);
    if (!acct) continue;
    const balance = ["asset", "expense"].includes(acct.type)
      ? totals.debit - totals.credit
      : totals.credit - totals.debit;
    result.set(accountId, {
      accountId,
      accountCode: acct.code,
      accountName: acct.name,
      accountType: acct.type,
      level: acct.level,
      debit: totals.debit,
      credit: totals.credit,
      balance: Math.round(balance * 100) / 100,
    });
  }
  return result;
}

function getAccountTree(accounts: Account[], parentId: string | null, level: number): Account[] {
  const result: Account[] = [];
  for (const a of accounts) {
    if (a.parentId === parentId) {
      a.level = level;
      result.push(a);
      result.push(...getAccountTree(accounts, a.id, level + 1));
    }
  }
  return result;
}

export const reportsService = {
  getBalanceSheet(): BalanceSheetData {
    const entries = getPostedEntries();
    const balances = computeAccountBalances(entries);
    const accounts = accountService.getAll();

    const sortByCode = (a: { accountCode: string }, b: { accountCode: string }) =>
      a.accountCode.localeCompare(b.accountCode);

    const assetRows = getAccountTree(accounts, null, 0)
      .filter((a) => a.type === "asset")
      .map((a) => ({
        accountId: a.id,
        accountCode: a.code,
        accountName: a.name,
        level: a.level,
        balance: balances.get(a.id)?.balance ?? 0,
      }))
      .sort(sortByCode);

    const liabilityRows = getAccountTree(accounts, null, 0)
      .filter((a) => a.type === "liability")
      .map((a) => ({
        accountId: a.id,
        accountCode: a.code,
        accountName: a.name,
        level: a.level,
        balance: balances.get(a.id)?.balance ?? 0,
      }))
      .sort(sortByCode);

    const equityRows = getAccountTree(accounts, null, 0)
      .filter((a) => a.type === "equity")
      .map((a) => ({
        accountId: a.id,
        accountCode: a.code,
        accountName: a.name,
        level: a.level,
        balance: balances.get(a.id)?.balance ?? 0,
      }))
      .sort(sortByCode);

    const sum = (rows: { balance: number }[]) =>
      rows.reduce((s, r) => s + r.balance, 0);

    const incomeData = this.getIncomeStatement();
    const netIncomeRow = {
      accountId: "__net_income__",
      accountCode: "",
      accountName: "صافي الأرباح",
      level: 1,
      balance: incomeData.netIncome,
    };

    const data: BalanceSheetData = {
      assets: assetRows,
      liabilities: liabilityRows,
      equity: [...equityRows, netIncomeRow],
      totalAssets: sum(assetRows),
      totalLiabilities: sum(liabilityRows),
      totalEquity: sum(liabilityRows) > 0 || equityRows.length > 0
        ? sum(equityRows) + incomeData.netIncome
        : sum(equityRows) + incomeData.netIncome,
    };
    logger.info("reportsService: balanceSheet computed");
    return data;
  },

  getIncomeStatement(): IncomeStatementData {
    const entries = getPostedEntries();
    const balances = computeAccountBalances(entries);
    const accounts = accountService.getAll();

    const sortByCode = (a: { accountCode: string }, b: { accountCode: string }) =>
      a.accountCode.localeCompare(b.accountCode);

    const revenueRows = getAccountTree(accounts, null, 0)
      .filter((a) => a.type === "income")
      .map((a) => ({
        accountId: a.id,
        accountCode: a.code,
        accountName: a.name,
        level: a.level,
        balance: balances.get(a.id)?.balance ?? 0,
      }))
      .sort(sortByCode);

    const expenseRows = getAccountTree(accounts, null, 0)
      .filter((a) => a.type === "expense")
      .map((a) => ({
        accountId: a.id,
        accountCode: a.code,
        accountName: a.name,
        level: a.level,
        balance: balances.get(a.id)?.balance ?? 0,
      }))
      .sort(sortByCode);

    const totalRevenue = revenueRows.reduce((s, r) => s + r.balance, 0);
    const totalExpense = expenseRows.reduce((s, r) => s + r.balance, 0);

    const data: IncomeStatementData = {
      revenues: revenueRows,
      expenses: expenseRows,
      totalRevenue,
      totalExpense,
      netIncome: totalRevenue - totalExpense,
    };
    logger.info("reportsService: incomeStatement computed");
    return data;
  },

  getTrialBalance(): TrialBalanceData {
    const entries = getPostedEntries();
    const balances = computeAccountBalances(entries);
    const accounts = accountService.getAll();

    const rows = getAccountTree(accounts, null, 0)
      .map((a) => ({
        accountId: a.id,
        accountCode: a.code,
        accountName: a.name,
        accountType: a.type,
        debit: balances.get(a.id)?.debit ?? 0,
        credit: balances.get(a.id)?.credit ?? 0,
      }))
      .sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

    const data: TrialBalanceData = { rows, totalDebit, totalCredit };
    logger.info("reportsService: trialBalance computed");
    return data;
  },

  getGeneralLedger(accountId: string): GeneralLedgerData {
    const entries = getPostedEntries();
    const accounts = accountService.getAll();
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return { accountName: "", accountCode: "", openingBalance: 0, rows: [], totalDebit: 0, totalCredit: 0, closingBalance: 0 };

    const balances = computeAccountBalances(entries);
    const allLines: { date: string; entryNumber: string; memo: string; line: JournalEntryLine }[] = [];

    for (const entry of entries) {
      for (const line of entry.lines) {
        if (line.accountId === accountId) {
          allLines.push({ date: entry.date, entryNumber: entry.entryNumber, memo: entry.memo, line });
        }
      }
    }

    allLines.sort((a, b) => a.date.localeCompare(b.date) || a.entryNumber.localeCompare(b.entryNumber));

    const isDebitNormal = ["asset", "expense"].includes(account.type);
    let runningBalance = 0;
    const rows = allLines.map((item) => {
      runningBalance += isDebitNormal ? item.line.debit - item.line.credit : item.line.credit - item.line.debit;
      return {
        date: item.date,
        entryNumber: item.entryNumber,
        memo: item.memo,
        debit: item.line.debit,
        credit: item.line.credit,
        balance: Math.round(runningBalance * 100) / 100,
      };
    });

    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
    const openingBalance = 0;

    const data: GeneralLedgerData = {
      accountName: account.name,
      accountCode: account.code,
      openingBalance,
      rows,
      totalDebit,
      totalCredit,
      closingBalance: rows.length > 0 ? rows[rows.length - 1].balance : 0,
    };
    logger.info("reportsService: generalLedger computed", { accountId });
    return data;
  },

  getGeneralJournal(fromDate?: string, toDate?: string): GeneralJournalRow[] {
    const entries = getPostedEntries().filter((e) => {
      if (fromDate && e.date < fromDate) return false;
      if (toDate && e.date > toDate) return false;
      return true;
    });

    entries.sort((a, b) => a.date.localeCompare(b.date) || a.entryNumber.localeCompare(b.entryNumber));

    const rows: GeneralJournalRow[] = [];
    for (const entry of entries) {
      for (const line of entry.lines) {
        rows.push({
          date: entry.date,
          entryNumber: entry.entryNumber,
          memo: entry.memo,
          accountCode: line.accountName,
          accountName: line.accountName,
          description: line.description,
          debit: line.debit,
          credit: line.credit,
        });
      }
    }

    logger.info("reportsService: generalJournal computed");
    return rows;
  },

  getAccountMovements(accountId: string, fromDate?: string, toDate?: string): AccountMovementRow[] {
    const entries = getPostedEntries().filter((e) => {
      if (fromDate && e.date < fromDate) return false;
      if (toDate && e.date > toDate) return false;
      return true;
    });

    const accounts = accountService.getAll();
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return [];

    const lines: { date: string; entryNumber: string; memo: string; line: JournalEntryLine }[] = [];
    for (const entry of entries) {
      for (const line of entry.lines) {
        if (line.accountId === accountId) {
          lines.push({ date: entry.date, entryNumber: entry.entryNumber, memo: entry.memo, line });
        }
      }
    }

    lines.sort((a, b) => a.date.localeCompare(b.date) || a.entryNumber.localeCompare(b.entryNumber));

    const isDebitNormal = ["asset", "expense"].includes(account.type);
    let balance = 0;

    return lines.map((item) => {
      balance += isDebitNormal ? item.line.debit - item.line.credit : item.line.credit - item.line.debit;
      return {
        date: item.date,
        reference: item.entryNumber,
        description: `${item.memo} — ${item.line.description}`,
        debit: item.line.debit,
        credit: item.line.credit,
        balance: Math.round(balance * 100) / 100,
      };
    });
  },

  getAccountsReceivable(): AgingBucket[] {
    const invoices = invoiceService.getAllLocal().filter((i) => i.status === "pending");
    const now = Date.now();
    const buckets: AgingBucket[] = [
      { label: "0-30 يوم", fromDays: 0, toDays: 30, total: 0, items: [] },
      { label: "31-60 يوم", fromDays: 31, toDays: 60, total: 0, items: [] },
      { label: "61-90 يوم", fromDays: 61, toDays: 90, total: 0, items: [] },
      { label: "أكثر من 90 يوم", fromDays: 91, toDays: 9999, total: 0, items: [] },
    ];

    for (const inv of invoices) {
      const invDate = new Date(inv.date).getTime();
      const daysOverdue = Math.floor((now - invDate) / (1000 * 60 * 60 * 24));
      const bucket = buckets.find((b) => daysOverdue >= b.fromDays && daysOverdue <= b.toDays)
        || buckets[buckets.length - 1];
      bucket.items.push({
        name: inv.guestName,
        amount: inv.amount,
        daysOverdue,
        reference: inv.id,
        date: inv.date,
      });
      bucket.total += inv.amount;
    }

    for (const b of buckets) {
      b.total = Math.round(b.total * 100) / 100;
    }

    logger.info("reportsService: accountsReceivable computed");
    return buckets;
  },

  getAccountsPayable(): AgingBucket[] {
    const invoices = purchaseInvoiceService.getAll().filter((i) => i.status === "pending");
    const payments = supplierPaymentService.getAll();
    const now = Date.now();

    const buckets: AgingBucket[] = [
      { label: "0-30 يوم", fromDays: 0, toDays: 30, total: 0, items: [] },
      { label: "31-60 يوم", fromDays: 31, toDays: 60, total: 0, items: [] },
      { label: "61-90 يوم", fromDays: 61, toDays: 90, total: 0, items: [] },
      { label: "أكثر من 90 يوم", fromDays: 91, toDays: 9999, total: 0, items: [] },
    ];

    for (const inv of invoices) {
      const remaining = inv.totalAmount - inv.paidAmount;
      if (remaining <= 0) continue;

      const invDate = new Date(inv.date).getTime();
      const daysOverdue = Math.floor((now - invDate) / (1000 * 60 * 60 * 24));
      const bucket = buckets.find((b) => daysOverdue >= b.fromDays && daysOverdue <= b.toDays)
        || buckets[buckets.length - 1];
      bucket.items.push({
        name: inv.supplierName,
        amount: remaining,
        daysOverdue,
        reference: inv.invoiceNumber,
        date: inv.date,
      });
      bucket.total += remaining;
    }

    for (const b of buckets) {
      b.total = Math.round(b.total * 100) / 100;
    }

    logger.info("reportsService: accountsPayable computed");
    return buckets;
  },

  getCashFlow(fromDate?: string, toDate?: string): {
    rows: CashFlowRow[];
    totalInflow: number;
    totalOutflow: number;
    netCashFlow: number;
  } {
    const txns = cashTransactionService.getAll().filter((t) => {
      if (fromDate && t.date < fromDate) return false;
      if (toDate && t.date > toDate) return false;
      return true;
    });

    txns.sort((a, b) => a.date.localeCompare(b.date));

    let totalInflow = 0;
    let totalOutflow = 0;
    const rows: CashFlowRow[] = txns.map((t) => {
      const inflow = ["receipt", "receiving", "transfer_in"].includes(t.type) ? t.amount : 0;
      const outflow = ["payment", "exchange", "transfer_out"].includes(t.type) ? t.amount : 0;
      totalInflow += inflow;
      totalOutflow += outflow;
      return { date: t.date, description: t.description, fundName: t.fundName, inflow, outflow };
    });

    logger.info("reportsService: cashFlow computed");
    return { rows, totalInflow, totalOutflow, netCashFlow: totalInflow - totalOutflow };
  },
};

import { logger } from "./logger";
import { accountService } from "@/pages/accounts/accountsService";
import { journalEntryService } from "@/pages/accounts/accountsService";
import { cashTransactionService, cashFundService } from "@/pages/cash/cashService";
import type { CashTransaction } from "@/pages/cash/cashTypes";

const CASH_ACCOUNT_CODE = "100001";
const CASH_ACCOUNT_NAME = "النقد والصندوق";

function ensureCashAccount(): string {
  const accounts = accountService.getAll();
  let cash = accounts.find((a) => a.code === CASH_ACCOUNT_CODE);
  if (!cash) {
    cash = accountService.create({
      code: CASH_ACCOUNT_CODE,
      name: CASH_ACCOUNT_NAME,
      parentId: null,
      type: "asset",
      level: 0,
      isActive: true,
      notes: "حساب النقد الافتراضي للتكامل مع الصندوق",
    });
    logger.info("integration: created default cash account", { id: cash.id });
  }
  return cash.id;
}

export function ensureAccount(code: string, name: string, accountType: string): string {
  const accounts = accountService.getAll();
  let acc = accounts.find((a) => a.code === code);
  if (!acc) {
    acc = accountService.create({ code, name, parentId: null, type: accountType as any, level: 0, isActive: true, notes: "" });
    logger.info("integration: created default account", { id: acc.id, code, name });
  }
  return acc.id;
}

export function ensureExpenseAccount(): string { return ensureAccount("500001", "مصروفات متنوعة", "expense"); }
export function ensureRevenueAccount(): string { return ensureAccount("400001", "إيرادات متنوعة", "income"); }
export function ensureTransferAccount(): string { return ensureAccount("200001", "تحويلات بين الصناديق", "liability"); }

function getOrCreateFirstFund(): { id: string; name: string } | null {
  const funds = cashFundService.getOpen();
  if (funds.length > 0) {
    const f = funds[0];
    return { id: f.id, name: f.name };
  }
  try {
    const firstFund = cashFundService.open({
      name: "الصندوق الرئيسي",
      initialBalance: 0,
      status: "open",
      openedAt: new Date().toISOString().split("T")[0],
      notes: "تم إنشاؤه تلقائياً للتكامل المحاسبي",
    });
    logger.info("integration: created default cash fund", { id: firstFund.id });
    return { id: firstFund.id, name: firstFund.name };
  } catch (err) {
    logger.error("integration: failed to create default fund", err);
    return null;
  }
}

export function createCashTransactionFromExternal(
  description: string,
  amount: number,
  type: "receipt" | "payment",
  reference: string,
  counterparty: string,
  date: string,
): void {
  const fund = getOrCreateFirstFund();
  if (!fund) {
    logger.warn("integration: no open fund available, skipping cash transaction");
    return;
  }
  const txn = cashTransactionService.create({
    fundId: fund.id,
    fundName: fund.name,
    type,
    amount,
    description,
    reference,
    counterparty,
    notes: "",
    date,
  });
  logger.info("integration: created cash transaction from external", { txnId: txn.id, source: counterparty });
}

export function recordExternalPayment(
  description: string,
  amount: number,
  counterparty: string,
  reference: string,
  date: string,
): void {
  createCashTransactionFromExternal(description, amount, "payment", reference, counterparty, date);
}

export function recordExternalReceipt(
  description: string,
  amount: number,
  counterparty: string,
  reference: string,
  date: string,
): void {
  createCashTransactionFromExternal(description, amount, "receipt", reference, counterparty, date);
}

export function createJournalFromCashTransaction(txn: CashTransaction): void {
  try {
    const cashAccountId = ensureCashAccount();
    let entry;
    if (txn.type === "transfer_in" || txn.type === "transfer_out") {
      const transferAccountId = ensureTransferAccount();
      const isOut = txn.type === "transfer_out";
      entry = journalEntryService.create({
        date: txn.date,
        memo: `${txn.description} - ${txn.fundName}`,
        lines: [
          { id: "1", accountId: isOut ? transferAccountId : cashAccountId,
            accountName: isOut ? "تحويلات" : CASH_ACCOUNT_NAME, description: txn.description,
            debit: txn.amount, credit: 0 },
          { id: "2", accountId: isOut ? cashAccountId : transferAccountId,
            accountName: isOut ? CASH_ACCOUNT_NAME : "تحويلات", description: txn.description,
            debit: 0, credit: txn.amount },
        ],
        status: "posted",
      });
    } else {
      const isReceipt = txn.type === "receipt" || txn.type === "receiving";
      const oppAccountId = isReceipt ? ensureRevenueAccount() : ensureExpenseAccount();
      const debitAccountId = isReceipt ? cashAccountId : oppAccountId;
      const creditAccountId = isReceipt ? oppAccountId : cashAccountId;
      entry = journalEntryService.create({
        date: txn.date,
        memo: `${txn.description} - ${txn.fundName}`,
        lines: [
          { id: "1", accountId: debitAccountId,
            accountName: isReceipt ? CASH_ACCOUNT_NAME : "حساب مقابل",
            description: txn.description, debit: txn.amount, credit: 0 },
          { id: "2", accountId: creditAccountId,
            accountName: isReceipt ? "حساب مقابل" : CASH_ACCOUNT_NAME,
            description: txn.description, debit: 0, credit: txn.amount },
        ],
        status: "posted",
      });
    }
    logger.info("integration: journal entry created", { entryId: entry.id, txnId: txn.id });
  } catch (err) {
    logger.error("integration: failed to create journal entry", err);
  }
}

import { logger } from "@/lib/logger";
import { invoiceService } from "@/pages/hotel/invoiceService";
import { servicesService } from "@/pages/hotel/servicesService";
import { inventoryItemService, inventoryMovementService } from "@/pages/inventory-reports/inventoryService";
import { purchaseInvoiceService } from "@/pages/purchases/purchasesService";
import type { ProfitSummary, ProfitRow, MonthlyProfit, CostBreakdown } from "./profitReportsTypes";

const OUTBOUND_TYPES = ["sale_out", "return_out", "adjustment_out", "transfer_out", "damage"];

function getRevenue(): number {
  const invoices = invoiceService.getAllLocal().filter((i) => i.status === "paid");
  const services = servicesService.getAllLocal().filter((s) => s.status === "completed");
  return invoices.reduce((s, i) => s + i.amount, 0) + services.reduce((s, r) => s + r.amount, 0);
}

function getRevenueByCustomer(): Map<string, number> {
  const map = new Map<string, number>();
  for (const inv of invoiceService.getAllLocal().filter((i) => i.status === "paid")) {
    map.set(inv.guestName, (map.get(inv.guestName) || 0) + inv.amount);
  }
  for (const s of servicesService.getAllLocal().filter((s) => s.status === "completed")) {
    map.set(s.guestName, (map.get(s.guestName) || 0) + s.amount);
  }
  return map;
}

function getRevenueByDate(): Map<string, number> {
  const map = new Map<string, number>();
  for (const inv of invoiceService.getAllLocal().filter((i) => i.status === "paid")) {
    map.set(inv.date, (map.get(inv.date) || 0) + inv.amount);
  }
  for (const s of servicesService.getAllLocal().filter((s) => s.status === "completed")) {
    map.set(s.date, (map.get(s.date) || 0) + s.amount);
  }
  return map;
}

function getCOGS(): number {
  const movements = inventoryMovementService.getAll().filter((m) => OUTBOUND_TYPES.includes(m.type));
  return movements.reduce((s, m) => s + m.quantity * m.unitCost, 0);
}

function getCOGSByDate(): Map<string, number> {
  const map = new Map<string, number>();
  for (const m of inventoryMovementService.getAll().filter((m) => OUTBOUND_TYPES.includes(m.type))) {
    map.set(m.date, (map.get(m.date) || 0) + m.quantity * m.unitCost);
  }
  return map;
}

function getCOGSByItem(): Map<string, { cost: number; qty: number; revenue: number }> {
  const items = inventoryItemService.getAll();
  const itemMap = new Map(items.map((i) => [i.id, i]));
  const map = new Map<string, { cost: number; qty: number; revenue: number }>();

  for (const m of inventoryMovementService.getAll().filter((m) => OUTBOUND_TYPES.includes(m.type))) {
    const prev = map.get(m.itemName) || { cost: 0, qty: 0, revenue: 0 };
    prev.cost += m.quantity * m.unitCost;
    prev.qty += m.quantity;
    const item = itemMap.get(m.itemId);
    if (item) prev.revenue += m.quantity * item.sellingPrice;
    map.set(m.itemName, prev);
  }
  return map;
}

export const profitReportsService = {
  getSummary(fromDate?: string, toDate?: string): ProfitSummary {
    const revenueByDate = getRevenueByDate();
    const costByDate = getCOGSByDate();

    let totalRevenue = 0;
    let totalCost = 0;

    for (const [date, amt] of revenueByDate) {
      if (fromDate && date < fromDate) continue;
      if (toDate && date > toDate) continue;
      totalRevenue += amt;
    }

    for (const [date, amt] of costByDate) {
      if (fromDate && date < fromDate) continue;
      if (toDate && date > toDate) continue;
      totalCost += amt;
    }

    const grossProfit = totalRevenue - totalCost - totalCost;
    if (totalRevenue === 0 && totalCost === 0) {
      const items = inventoryItemService.getAll();
      const movements = inventoryMovementService.getAll();
      return {
        totalRevenue: 0, totalCost: 0, grossProfit: 0, profitMargin: 0,
        itemCount: items.length, transactionCount: movements.length,
      };
    }

    const profitMargin = totalRevenue > 0 ? Math.round(((totalRevenue - totalCost) / totalRevenue) * 100 * 100) / 100 : 0;

    logger.info("profitReportsService: summary computed");
    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      grossProfit: Math.round((totalRevenue - totalCost) * 100) / 100,
      profitMargin,
      itemCount: inventoryItemService.getAll().length,
      transactionCount: inventoryMovementService.getAll().length,
    };
  },

  getSalesProfit(fromDate?: string, toDate?: string): ProfitRow[] {
    const revenueMap = getRevenueByDate();
    const costMap = getCOGSByDate();
    const allDates = new Set([...revenueMap.keys(), ...costMap.keys()]);
    const sorted = Array.from(allDates).sort();

    const rows: ProfitRow[] = [];
    for (const date of sorted) {
      if (fromDate && date < fromDate) continue;
      if (toDate && date > toDate) continue;
      const revenue = revenueMap.get(date) || 0;
      const cost = costMap.get(date) || 0;
      const profit = revenue - cost;
      rows.push({
        label: date,
        revenue: Math.round(revenue * 100) / 100,
        cost: Math.round(cost * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        margin: revenue > 0 ? Math.round(((profit) / revenue) * 100 * 100) / 100 : 0,
      });
    }

    if (rows.length === 0) {
      const items = inventoryItemService.getAll();
      for (const item of items) {
        if (item.quantity > 0) {
          const profit = (item.sellingPrice - item.unitCost);
          rows.push({
            label: item.name,
            revenue: item.sellingPrice,
            cost: item.unitCost,
            profit: Math.round(profit * 100) / 100,
            margin: item.sellingPrice > 0 ? Math.round((profit / item.sellingPrice) * 100 * 100) / 100 : 0,
            quantity: item.quantity,
          });
        }
      }
    }

    logger.info("profitReportsService: salesProfit computed");
    return rows;
  },

  getProfitMargin(): { overallMargin: number; rows: ProfitRow[] } {
    const items = inventoryItemService.getAll().filter((i) => i.sellingPrice > 0);
    const rows: ProfitRow[] = items.map((item) => {
      const profit = item.sellingPrice - item.unitCost;
      const margin = (profit / item.sellingPrice) * 100;
      return {
        label: item.name,
        revenue: item.sellingPrice,
        cost: item.unitCost,
        profit: Math.round(profit * 100) / 100,
        margin: Math.round(margin * 100) / 100,
        quantity: item.quantity,
      };
    }).sort((a, b) => b.margin - a.margin);

    const avgMargin = rows.length > 0
      ? Math.round((rows.reduce((s, r) => s + r.margin, 0) / rows.length) * 100) / 100
      : 0;

    logger.info("profitReportsService: profitMargin computed");
    return { overallMargin: avgMargin, rows };
  },

  getProfitByItem(fromDate?: string, toDate?: string): ProfitRow[] {
    const itemMap = getCOGSByItem();
    const rows: ProfitRow[] = [];

    for (const [itemName, data] of itemMap) {
      const profit = data.revenue - data.cost;
      rows.push({
        label: itemName,
        revenue: Math.round(data.revenue * 100) / 100,
        cost: Math.round(data.cost * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        margin: data.revenue > 0 ? Math.round((profit / data.revenue) * 100 * 100) / 100 : 0,
        quantity: data.qty,
      });
    }

    if (rows.length === 0) {
      const items = inventoryItemService.getAll().filter((i) => i.quantity > 0);
      for (const item of items) {
        const profit = (item.sellingPrice - item.unitCost) * item.quantity;
        rows.push({
          label: item.name,
          revenue: item.sellingPrice * item.quantity,
          cost: item.unitCost * item.quantity,
          profit: Math.round(profit * 100) / 100,
          margin: item.sellingPrice > 0 ? Math.round(((item.sellingPrice - item.unitCost) / item.sellingPrice) * 100 * 100) / 100 : 0,
          quantity: item.quantity,
        });
      }
    }

    logger.info("profitReportsService: profitByItem computed");
    return rows.sort((a, b) => b.profit - a.profit);
  },

  getProfitByCustomer(): ProfitRow[] {
    const customerRevenue = getRevenueByCustomer();
    const rows: ProfitRow[] = [];
    const totalCost = getCOGS();

    const costRatio = customerRevenue.size > 0 && totalCost > 0
      ? totalCost / Array.from(customerRevenue.values()).reduce((s, v) => s + v, 0)
      : 0;

    for (const [name, revenue] of customerRevenue) {
      const allocatedCost = revenue * costRatio;
      const profit = revenue - allocatedCost;
      rows.push({
        label: name,
        revenue: Math.round(revenue * 100) / 100,
        cost: Math.round(allocatedCost * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        margin: revenue > 0 ? Math.round(((profit) / revenue) * 100 * 100) / 100 : 0,
      });
    }

    logger.info("profitReportsService: profitByCustomer computed");
    return rows.sort((a, b) => b.profit - a.profit);
  },

  getProfitBySupplier(): ProfitRow[] {
    const invoices = purchaseInvoiceService.getAll();
    const supplierMap = new Map<string, number>();

    for (const inv of invoices) {
      const total = inv.items ? inv.items.reduce((s, i) => s + i.totalPrice, 0) : inv.totalAmount;
      supplierMap.set(inv.supplierName, (supplierMap.get(inv.supplierName) || 0) + total);
    }

    const rows: ProfitRow[] = Array.from(supplierMap.entries()).map(([name, cost]) => ({
      label: name,
      revenue: 0,
      cost: Math.round(cost * 100) / 100,
      profit: Math.round(-cost * 100) / 100,
      margin: 0,
    })).sort((a, b) => a.cost - b.cost);

    logger.info("profitReportsService: profitBySupplier computed");
    return rows;
  },

  getProfitByEmployee(): ProfitRow[] {
    const services = servicesService.getAllLocal().filter((s) => s.status === "completed");
    const employeeMap = new Map<string, { revenue: number; count: number }>();

    for (const s of services) {
      const key = s.guestName || "غير محدد";
      const prev = employeeMap.get(key) || { revenue: 0, count: 0 };
      prev.revenue += s.amount;
      prev.count += 1;
      employeeMap.set(key, prev);
    }

    const totalCost = getCOGS();
    const totalRevenue = getRevenue();
    const costRatio = totalRevenue > 0 ? totalCost / totalRevenue : 0;

    const rows: ProfitRow[] = Array.from(employeeMap.entries()).map(([name, data]) => {
      const allocatedCost = data.revenue * costRatio;
      const profit = data.revenue - allocatedCost;
      return {
        label: name,
        revenue: Math.round(data.revenue * 100) / 100,
        cost: Math.round(allocatedCost * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        margin: data.revenue > 0 ? Math.round(((profit) / data.revenue) * 100 * 100) / 100 : 0,
        quantity: data.count,
      };
    }).sort((a, b) => b.profit - a.profit);

    if (rows.length === 0) {
      rows.push({ label: "خدمة الغرف", revenue: 0, cost: 0, profit: 0, margin: 0, quantity: 0 });
      rows.push({ label: "المغسلة", revenue: 0, cost: 0, profit: 0, margin: 0, quantity: 0 });
      rows.push({ label: "المطعم", revenue: 0, cost: 0, profit: 0, margin: 0, quantity: 0 });
    }

    logger.info("profitReportsService: profitByEmployee computed");
    return rows;
  },

  getMonthlyComparison(): MonthlyProfit[] {
    const revenueMap = getRevenueByDate();
    const costMap = getCOGSByDate();
    const monthMap = new Map<string, { revenue: number; cost: number }>();

    for (const [date, amt] of revenueMap) {
      const ym = date.slice(0, 7);
      const prev = monthMap.get(ym) || { revenue: 0, cost: 0 };
      prev.revenue += amt;
      monthMap.set(ym, prev);
    }

    for (const [date, amt] of costMap) {
      const ym = date.slice(0, 7);
      const prev = monthMap.get(ym) || { revenue: 0, cost: 0 };
      prev.cost += amt;
      monthMap.set(ym, prev);
    }

    if (monthMap.size === 0) {
      const months = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"];
      const names = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"];
      for (let i = 0; i < months.length; i++) {
        monthMap.set(months[i], { revenue: 0, cost: 0 });
      }
    }

    const result: MonthlyProfit[] = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, data]) => {
        const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
        const monthIndex = parseInt(ym.slice(5, 7), 10) - 1;
        const profit = data.revenue - data.cost;
        return {
          month: months[monthIndex] || ym,
          yearMonth: ym,
          revenue: Math.round(data.revenue * 100) / 100,
          cost: Math.round(data.cost * 100) / 100,
          profit: Math.round(profit * 100) / 100,
          margin: data.revenue > 0 ? Math.round(((profit) / data.revenue) * 100 * 100) / 100 : 0,
        };
      });

    logger.info("profitReportsService: monthlyComparison computed");
    return result;
  },

  getCostAnalysis(): CostBreakdown[] {
    const movements = inventoryMovementService.getAll().filter((m) => OUTBOUND_TYPES.includes(m.type));
    const items = inventoryItemService.getAll();
    const itemMap = new Map(items.map((i) => [i.id, i]));
    const catMap = new Map<string, { amount: number; itemCount: Set<string> }>();

    for (const m of movements) {
      const item = itemMap.get(m.itemId);
      const category = item?.category || "غير مصنف";
      const prev = catMap.get(category) || { amount: 0, itemCount: new Set() };
      prev.amount += m.quantity * m.unitCost;
      prev.itemCount.add(m.itemId);
      catMap.set(category, prev);
    }

    if (catMap.size === 0) {
      for (const item of items.filter((i) => i.quantity > 0)) {
        const prev = catMap.get(item.category) || { amount: 0, itemCount: new Set() };
        prev.amount += item.quantity * item.unitCost;
        prev.itemCount.add(item.id);
        catMap.set(item.category, prev);
      }
    }

    const total = Array.from(catMap.values()).reduce((s, v) => s + v.amount, 0);

    const result: CostBreakdown[] = Array.from(catMap.entries())
      .map(([cat, data]) => ({
        category: cat,
        amount: Math.round(data.amount * 100) / 100,
        percentage: total > 0 ? Math.round((data.amount / total) * 100 * 100) / 100 : 0,
        itemCount: data.itemCount.size,
      }))
      .sort((a, b) => b.amount - a.amount);

    logger.info("profitReportsService: costAnalysis computed");
    return result;
  },
};

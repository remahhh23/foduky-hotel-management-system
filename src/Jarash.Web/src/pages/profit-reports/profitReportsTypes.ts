export interface ProfitSummary {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  itemCount: number;
  transactionCount: number;
}

export interface ProfitRow {
  label: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  quantity?: number;
}

export interface MonthlyProfit {
  month: string;
  yearMonth: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

export interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  itemCount: number;
}

export interface BudgetSummaryItem {
  itemId: string;
  name: string;
  categoryId: string;
  direction: string;
  type: string;
  plannedAmount: number;
  actualAmount: number;
}

export interface BudgetSummary {
  yearMonth: string;
  personalIncome: number;
  personalExpenses: number;
  jointExpenses: number;
  yourJointShare: number;
  freeAmount: number;
  personalItems: BudgetSummaryItem[];
  jointItems: BudgetSummaryItem[];
}

export interface IBudgetSummaryService {
  getSummary(customerId: string, yearMonth: string): Promise<BudgetSummary>;
}

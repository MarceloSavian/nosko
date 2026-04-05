import type { BudgetSummary } from '@/domain/models/budget/BudgetPlan';

export interface ILoadBudgetSummary {
  execute(yearMonth: string): Promise<BudgetSummary>;
}

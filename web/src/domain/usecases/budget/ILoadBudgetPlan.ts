import type { BudgetPlanWithItems } from '@/domain/models/budget/BudgetPlan';

export interface ILoadBudgetPlan {
  execute(yearMonth: string): Promise<BudgetPlanWithItems | null>;
}

import type { BudgetPlanWithItems } from '@/domain/models/budget/BudgetPlan';

export interface ILoadJointBudgetPlan {
  execute(yearMonth: string): Promise<BudgetPlanWithItems | null>;
}

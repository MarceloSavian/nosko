import type { BudgetItem, UpdateBudgetItemInput } from '@/domain/models/budget/BudgetPlan';

export interface IUpdateBudgetItem {
  execute(planId: string, itemId: string, input: UpdateBudgetItemInput): Promise<BudgetItem>;
}

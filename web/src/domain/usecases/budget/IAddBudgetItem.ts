import type { AddBudgetItemInput, BudgetItem } from '@/domain/models/budget/BudgetPlan';

export interface IAddBudgetItem {
  execute(planId: string, input: AddBudgetItemInput): Promise<BudgetItem>;
}

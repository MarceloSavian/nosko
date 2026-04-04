import type { BudgetPlanWithItems, CreateBudgetPlanInput } from '@/domain/models/budget/BudgetPlan';

export interface ICreateBudgetPlan {
  execute(input: CreateBudgetPlanInput): Promise<BudgetPlanWithItems>;
}

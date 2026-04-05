import type { BudgetPlanWithItems, CreateBudgetPlanInput } from '@/domain/models/budget/BudgetPlan';

export interface ICreateJointBudgetPlan {
  execute(input: CreateBudgetPlanInput): Promise<BudgetPlanWithItems>;
}

import type {
  BudgetItemSchema,
  CreateBudgetItemInput,
  UpdateBudgetItemInput,
} from '../../../domain/models/budget/BudgetPlan.js';

export interface IBudgetItemRepository {
  findByPlanId(planId: string): Promise<BudgetItemSchema[]>;
  findById(id: string): Promise<BudgetItemSchema | null>;
  insert(
    planId: string,
    input: CreateBudgetItemInput,
    installmentNumber?: number,
    sourceItemId?: string,
  ): Promise<BudgetItemSchema>;
  update(id: string, input: UpdateBudgetItemInput): Promise<BudgetItemSchema>;
  delete(id: string): Promise<void>;
}

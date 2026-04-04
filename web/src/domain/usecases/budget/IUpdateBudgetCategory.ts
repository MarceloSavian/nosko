import type {
  BudgetCategory,
  UpdateBudgetCategoryInput,
} from '@/domain/models/budget/BudgetCategory';

export interface IUpdateBudgetCategory {
  execute(id: string, input: UpdateBudgetCategoryInput): Promise<BudgetCategory>;
}

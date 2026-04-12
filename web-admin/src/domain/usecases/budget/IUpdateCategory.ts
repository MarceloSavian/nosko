import type {
  BudgetCategorySchema,
  UpdateBudgetCategoryInput,
} from '@/domain/models/budget/BudgetCategory';

export interface IUpdateCategory {
  execute(id: string, input: UpdateBudgetCategoryInput): Promise<BudgetCategorySchema>;
}

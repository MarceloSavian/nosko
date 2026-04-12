import type {
  BudgetCategorySchema,
  CreateBudgetCategoryInput,
} from '@/domain/models/budget/BudgetCategory';

export interface ICreateCategory {
  execute(input: CreateBudgetCategoryInput): Promise<BudgetCategorySchema>;
}

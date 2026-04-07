import type {
  BudgetCategory,
  CreateBudgetCategoryInput,
} from '@/domain/models/budget/BudgetCategory';

export interface ICreateBudgetCategory {
  execute(input: CreateBudgetCategoryInput): Promise<BudgetCategory>;
}

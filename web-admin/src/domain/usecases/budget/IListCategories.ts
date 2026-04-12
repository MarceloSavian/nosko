import type { BudgetCategorySchema } from '@/domain/models/budget/BudgetCategory';

export interface IListCategories {
  execute(): Promise<BudgetCategorySchema[]>;
}

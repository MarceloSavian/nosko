import type { BudgetCategory } from '@/domain/models/budget/BudgetCategory';

export interface ILoadBudgetCategories {
  execute(): Promise<BudgetCategory[]>;
}

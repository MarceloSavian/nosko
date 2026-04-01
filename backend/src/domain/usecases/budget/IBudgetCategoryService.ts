import type {
  BudgetCategorySchema,
  CreateBudgetCategoryInput,
  UpdateBudgetCategoryInput,
} from '../../models/budget/BudgetCategory.js';

export interface IBudgetCategoryService {
  listCategories(): Promise<BudgetCategorySchema[]>;
  createCategory(input: CreateBudgetCategoryInput): Promise<BudgetCategorySchema>;
  updateCategory(id: string, input: UpdateBudgetCategoryInput): Promise<BudgetCategorySchema>;
  deleteCategory(id: string): Promise<void>;
}

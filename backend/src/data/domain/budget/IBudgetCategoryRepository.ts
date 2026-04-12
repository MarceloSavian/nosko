import type {
  BudgetCategorySchema,
  CreateBudgetCategoryInput,
  UpdateBudgetCategoryInput,
} from '../../../domain/models/budget/BudgetCategory.js';

export interface IBudgetCategoryRepository {
  findAll(): Promise<BudgetCategorySchema[]>;
  findById(id: string): Promise<BudgetCategorySchema | null>;
  insert(input: CreateBudgetCategoryInput & { isSystem?: boolean }): Promise<BudgetCategorySchema>;
  update(id: string, input: UpdateBudgetCategoryInput): Promise<BudgetCategorySchema>;
  delete(id: string): Promise<void>;
}

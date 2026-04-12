import type {
  BudgetCategorySchema,
  CreateBudgetCategoryInput,
  UpdateBudgetCategoryInput,
} from '@/domain/models/budget/BudgetCategory';

export interface IBudgetCategoryGateway {
  list(): Promise<BudgetCategorySchema[]>;
  create(input: CreateBudgetCategoryInput): Promise<BudgetCategorySchema>;
  update(id: string, input: UpdateBudgetCategoryInput): Promise<BudgetCategorySchema>;
  delete(id: string): Promise<void>;
}

import { mock } from 'node:test';
import type {
  BudgetCategorySchema,
  CreateBudgetCategoryInput,
  UpdateBudgetCategoryInput,
} from '../../domain/models/budget/BudgetCategory.js';
import type { IBudgetCategoryService } from '../../domain/usecases/budget/IBudgetCategoryService.js';

const defaultCategory: BudgetCategorySchema = {
  id: '',
  name: '',
  icon: null,
  isSystem: false,
  createdAt: '',
};

class MockBudgetCategoryService implements IBudgetCategoryService {
  listCategories = mock.fn(async (): Promise<BudgetCategorySchema[]> => []);
  createCategory = mock.fn(
    async (_input: CreateBudgetCategoryInput): Promise<BudgetCategorySchema> => ({
      ...defaultCategory,
    }),
  );
  updateCategory = mock.fn(
    async (_id: string, _input: UpdateBudgetCategoryInput): Promise<BudgetCategorySchema> => ({
      ...defaultCategory,
    }),
  );
  deleteCategory = mock.fn(async (_id: string): Promise<void> => {});
}

export const mockBudgetCategoryService = new MockBudgetCategoryService();

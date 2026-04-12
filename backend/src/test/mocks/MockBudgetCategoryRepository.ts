import { mock } from 'node:test';
import type { IBudgetCategoryRepository } from '../../data/domain/budget/IBudgetCategoryRepository.js';
import type {
  BudgetCategorySchema,
  CreateBudgetCategoryInput,
  UpdateBudgetCategoryInput,
} from '../../domain/models/budget/BudgetCategory.js';

const defaultCategory: BudgetCategorySchema = {
  id: '',
  name: '',
  icon: null,
  isSystem: false,
  createdAt: '',
};

class MockBudgetCategoryRepository implements IBudgetCategoryRepository {
  findAll = mock.fn(async (): Promise<BudgetCategorySchema[]> => []);
  findById = mock.fn(async (_id: string): Promise<BudgetCategorySchema | null> => null);
  insert = mock.fn(
    async (
      _input: CreateBudgetCategoryInput & { isSystem?: boolean },
    ): Promise<BudgetCategorySchema> => ({
      ...defaultCategory,
    }),
  );
  update = mock.fn(
    async (_id: string, _input: UpdateBudgetCategoryInput): Promise<BudgetCategorySchema> => ({
      ...defaultCategory,
    }),
  );
  delete = mock.fn(async (_id: string): Promise<void> => {});
}

export const mockBudgetCategoryRepository = new MockBudgetCategoryRepository();

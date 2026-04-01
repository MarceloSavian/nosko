import { mock } from 'node:test';
import type { IBudgetItemRepository } from '../../data/domain/budget/IBudgetItemRepository.js';
import type {
  BudgetItemSchema,
  CreateBudgetItemInput,
  UpdateBudgetItemInput,
} from '../../domain/models/budget/BudgetPlan.js';

const defaultItem: BudgetItemSchema = {
  id: '',
  planId: '',
  categoryId: '',
  name: '',
  plannedAmount: '0',
  type: 'FIXED',
  recurrence: 'PERMANENT',
  installmentTotal: null,
  installmentNumber: null,
  sourceItemId: null,
  createdAt: '',
  updatedAt: '',
};

class MockBudgetItemRepository implements IBudgetItemRepository {
  findByPlanId = mock.fn(async (_planId: string): Promise<BudgetItemSchema[]> => []);
  findById = mock.fn(async (_id: string): Promise<BudgetItemSchema | null> => null);
  insert = mock.fn(
    async (
      _planId: string,
      _input: CreateBudgetItemInput,
      _installmentNumber?: number,
      _sourceItemId?: string,
    ): Promise<BudgetItemSchema> => ({ ...defaultItem }),
  );
  update = mock.fn(
    async (_id: string, _input: UpdateBudgetItemInput): Promise<BudgetItemSchema> => ({
      ...defaultItem,
    }),
  );
  delete = mock.fn(async (_id: string): Promise<void> => {});
}

export const mockBudgetItemRepository = new MockBudgetItemRepository();

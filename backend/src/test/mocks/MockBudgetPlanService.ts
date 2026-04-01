import { mock } from 'node:test';
import {
  BudgetItemRecurrence,
  type BudgetItemSchema,
  BudgetItemType,
  type BudgetPlanSchema,
  type CreateBudgetItemInput,
  type CreateBudgetPlanInput,
  type UpdateBudgetItemInput,
} from '../../domain/models/budget/BudgetPlan.js';
import type { IBudgetPlanService } from '../../domain/usecases/budget/IBudgetPlanService.js';

const defaultPlan: BudgetPlanSchema = {
  id: '',
  customerId: null,
  partnershipId: null,
  yearMonth: '',
  currencyCode: 'USD',
  isJoint: false,
  createdAt: '',
  updatedAt: '',
};

const defaultItem: BudgetItemSchema = {
  id: '',
  planId: '',
  categoryId: '',
  name: '',
  plannedAmount: '0',
  type: BudgetItemType.FIXED,
  recurrence: BudgetItemRecurrence.PERMANENT,
  installmentTotal: null,
  installmentNumber: null,
  sourceItemId: null,
  createdAt: '',
  updatedAt: '',
};

class MockBudgetPlanService implements IBudgetPlanService {
  getPersonalPlan = mock.fn(
    async (
      _customerId: string,
      _yearMonth: string,
    ): Promise<{ plan: BudgetPlanSchema; items: BudgetItemSchema[] } | null> => null,
  );
  createPersonalPlan = mock.fn(
    async (
      _customerId: string,
      _input: CreateBudgetPlanInput,
    ): Promise<{ plan: BudgetPlanSchema; items: BudgetItemSchema[] }> => ({
      plan: { ...defaultPlan },
      items: [],
    }),
  );
  deletePersonalPlan = mock.fn(async (_customerId: string, _planId: string): Promise<void> => {});
  getJointPlan = mock.fn(
    async (
      _customerId: string,
      _yearMonth: string,
    ): Promise<{ plan: BudgetPlanSchema; items: BudgetItemSchema[] } | null> => null,
  );
  createJointPlan = mock.fn(
    async (
      _customerId: string,
      _input: CreateBudgetPlanInput,
    ): Promise<{ plan: BudgetPlanSchema; items: BudgetItemSchema[] }> => ({
      plan: { ...defaultPlan },
      items: [],
    }),
  );
  deleteJointPlan = mock.fn(async (_customerId: string, _planId: string): Promise<void> => {});
  addItem = mock.fn(
    async (_planId: string, _input: CreateBudgetItemInput): Promise<BudgetItemSchema> => ({
      ...defaultItem,
    }),
  );
  updateItem = mock.fn(
    async (
      _planId: string,
      _itemId: string,
      _input: UpdateBudgetItemInput,
    ): Promise<BudgetItemSchema> => ({ ...defaultItem }),
  );
  deleteItem = mock.fn(async (_planId: string, _itemId: string): Promise<void> => {});
}

export const mockBudgetPlanService = new MockBudgetPlanService();

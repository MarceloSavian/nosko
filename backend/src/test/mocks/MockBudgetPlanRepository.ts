import { mock } from 'node:test';
import type { IBudgetPlanRepository } from '../../data/domain/budget/IBudgetPlanRepository.js';
import type { BudgetPlanSchema } from '../../domain/models/budget/BudgetPlan.js';

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

class MockBudgetPlanRepository implements IBudgetPlanRepository {
  findByCustomerAndMonth = mock.fn(
    async (_customerId: string, _yearMonth: string): Promise<BudgetPlanSchema | null> => null,
  );
  findByPartnershipAndMonth = mock.fn(
    async (_partnershipId: string, _yearMonth: string): Promise<BudgetPlanSchema | null> => null,
  );
  findById = mock.fn(async (_id: string): Promise<BudgetPlanSchema | null> => null);
  insertPersonal = mock.fn(
    async (
      _customerId: string,
      _yearMonth: string,
      _currencyCode: string,
    ): Promise<BudgetPlanSchema> => ({ ...defaultPlan }),
  );
  insertJoint = mock.fn(
    async (
      _partnershipId: string,
      _yearMonth: string,
      _currencyCode: string,
    ): Promise<BudgetPlanSchema> => ({ ...defaultPlan }),
  );
  delete = mock.fn(async (_id: string): Promise<void> => {});
}

export const mockBudgetPlanRepository = new MockBudgetPlanRepository();

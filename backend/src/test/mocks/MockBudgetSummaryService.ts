import { mock } from 'node:test';
import type {
  BudgetSummary,
  IBudgetSummaryService,
} from '../../domain/usecases/budget/IBudgetSummaryService.js';

const defaultSummary: BudgetSummary = {
  yearMonth: '',
  personalIncome: 0,
  personalExpenses: 0,
  jointExpenses: 0,
  yourJointShare: 0,
  freeAmount: 0,
  personalItems: [],
  jointItems: [],
};

class MockBudgetSummaryService implements IBudgetSummaryService {
  getSummary = mock.fn(
    async (_customerId: string, _yearMonth: string): Promise<BudgetSummary> => ({
      ...defaultSummary,
    }),
  );
}

export const mockBudgetSummaryService = new MockBudgetSummaryService();

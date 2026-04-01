import { mock } from 'node:test';
import type {
  DashboardData,
  IDashboardService,
} from '../../domain/usecases/dashboard/IDashboardService.js';

class MockDashboardService implements IDashboardService {
  getDashboard = mock.fn(
    async (_customerId: string, _yearMonth: string): Promise<DashboardData> => ({
      yearMonth: '',
      totalSpending: 0,
      budgetSummary: [],
      recentTransactions: [],
    }),
  );
}

export const mockDashboardService = new MockDashboardService();

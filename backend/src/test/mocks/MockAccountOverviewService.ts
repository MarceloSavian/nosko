import { mock } from 'node:test';
import type { IAccountOverviewService } from '../../domain/usecases/account/IAccountOverviewService.js';

class MockAccountOverviewService implements IAccountOverviewService {
  getOverview = mock.fn(
    async (
      _customerId: string,
    ): Promise<{ totalsByCurrency: { currencyCode: string; total: number }[] }> => ({
      totalsByCurrency: [],
    }),
  );
}

export const mockAccountOverviewService = new MockAccountOverviewService();

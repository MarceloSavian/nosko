import { mock } from 'node:test';
import type { ICurrencyDefaultRepository } from '../../data/domain/currency/ICurrencyDefaultRepository.js';
import type { CurrencyDefaultSchema } from '../../domain/models/currency/Currency.js';

class MockCurrencyDefaultRepository implements ICurrencyDefaultRepository {
  findByCustomerId = mock.fn(async (_customerId: string): Promise<CurrencyDefaultSchema[]> => []);
  replaceAll = mock.fn(
    async (
      _customerId: string,
      _currencies: { currencyCode: string; displayOrder: number }[],
    ): Promise<CurrencyDefaultSchema[]> => [],
  );
}

export const mockCurrencyDefaultRepository = new MockCurrencyDefaultRepository();

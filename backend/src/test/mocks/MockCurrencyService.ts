import { mock } from 'node:test';
import type {
  CurrencyDefaultSchema,
  SetCurrencyDefaultsInput,
} from '../../domain/models/currency/Currency.js';
import type { ICurrencyService } from '../../domain/usecases/currency/ICurrencyService.js';

class MockCurrencyService implements ICurrencyService {
  getCurrencyDefaults = mock.fn(
    async (_customerId: string): Promise<CurrencyDefaultSchema[]> => [],
  );
  setCurrencyDefaults = mock.fn(
    async (
      _customerId: string,
      _input: SetCurrencyDefaultsInput,
    ): Promise<CurrencyDefaultSchema[]> => [],
  );
}

export const mockCurrencyService = new MockCurrencyService();

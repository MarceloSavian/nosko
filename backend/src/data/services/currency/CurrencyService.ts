import type {
  CurrencyDefaultSchema,
  SetCurrencyDefaultsInput,
} from '../../../domain/models/currency/Currency.js';
import type { ICurrencyService } from '../../../domain/usecases/currency/ICurrencyService.js';
import type { ICurrencyDefaultRepository } from '../../domain/currency/ICurrencyDefaultRepository.js';

export class CurrencyService implements ICurrencyService {
  constructor(private readonly currencyDefaultRepository: ICurrencyDefaultRepository) {}

  async getCurrencyDefaults(customerId: string): Promise<CurrencyDefaultSchema[]> {
    return await this.currencyDefaultRepository.findByCustomerId(customerId);
  }

  async setCurrencyDefaults(
    customerId: string,
    input: SetCurrencyDefaultsInput,
  ): Promise<CurrencyDefaultSchema[]> {
    return await this.currencyDefaultRepository.replaceAll(customerId, input.currencies);
  }
}

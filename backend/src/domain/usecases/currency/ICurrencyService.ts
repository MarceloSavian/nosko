import type {
  CurrencyDefaultSchema,
  SetCurrencyDefaultsInput,
} from '../../models/currency/Currency.js';

export interface ICurrencyService {
  getCurrencyDefaults(customerId: string): Promise<CurrencyDefaultSchema[]>;
  setCurrencyDefaults(
    customerId: string,
    input: SetCurrencyDefaultsInput,
  ): Promise<CurrencyDefaultSchema[]>;
}

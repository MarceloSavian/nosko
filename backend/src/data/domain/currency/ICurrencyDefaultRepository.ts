import type { CurrencyDefaultSchema } from '../../../domain/models/currency/Currency.js';

export interface ICurrencyDefaultRepository {
  findByCustomerId(customerId: string): Promise<CurrencyDefaultSchema[]>;
  replaceAll(
    customerId: string,
    currencies: { currencyCode: string; displayOrder: number }[],
  ): Promise<CurrencyDefaultSchema[]>;
}

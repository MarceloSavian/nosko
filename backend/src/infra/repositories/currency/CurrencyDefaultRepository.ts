import type { Pool } from 'pg';
import type { ICurrencyDefaultRepository } from '../../../data/domain/currency/ICurrencyDefaultRepository.js';
import type { CurrencyDefaultSchema } from '../../../domain/models/currency/Currency.js';

type CurrencyDefaultRow = {
  id: string;
  currency_code: string;
  display_order: number;
};

function toSchema(row: CurrencyDefaultRow): CurrencyDefaultSchema {
  return {
    id: row.id,
    currencyCode: row.currency_code,
    displayOrder: row.display_order,
  };
}

export class CurrencyDefaultRepository implements ICurrencyDefaultRepository {
  constructor(private readonly pool: Pool) {}

  async findByCustomerId(customerId: string): Promise<CurrencyDefaultSchema[]> {
    const result = await this.pool.query<CurrencyDefaultRow>(
      'SELECT id, currency_code, display_order FROM currency_defaults WHERE customer_id = $1 ORDER BY display_order',
      [customerId],
    );
    return result.rows.map(toSchema);
  }

  async replaceAll(
    customerId: string,
    currencies: { currencyCode: string; displayOrder: number }[],
  ): Promise<CurrencyDefaultSchema[]> {
    await this.pool.query('DELETE FROM currency_defaults WHERE customer_id = $1', [customerId]);

    const results: CurrencyDefaultSchema[] = [];
    for (const currency of currencies) {
      const result = await this.pool.query<CurrencyDefaultRow>(
        'INSERT INTO currency_defaults (customer_id, currency_code, display_order) VALUES ($1, $2, $3) RETURNING id, currency_code, display_order',
        [customerId, currency.currencyCode, currency.displayOrder],
      );
      const row = result.rows[0];
      if (row) results.push(toSchema(row));
    }

    return results;
  }
}

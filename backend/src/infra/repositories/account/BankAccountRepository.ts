import type { Pool } from 'pg';
import type { IBankAccountRepository } from '../../../data/domain/account/IBankAccountRepository.js';
import type {
  BankAccountSchema,
  CreateBankAccountInput,
  UpdateBankAccountInput,
} from '../../../domain/models/account/Account.js';

type BankAccountRow = {
  id: string;
  customer_id: string;
  institution_id: string;
  account_name: string;
  account_number_last4: string | null;
  currency_code: string;
  balance: string;
  account_type: string | null;
  balance_updated_at: Date | null;
  created_at: Date;
};

function toSchema(row: BankAccountRow): BankAccountSchema {
  return {
    id: row.id,
    customerId: row.customer_id,
    institutionId: row.institution_id,
    accountName: row.account_name,
    accountNumberLast4: row.account_number_last4,
    currencyCode: row.currency_code,
    balance: row.balance,
    accountType: row.account_type,
    balanceUpdatedAt: row.balance_updated_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
  };
}

const COLUMNS =
  'id, customer_id, institution_id, account_name, account_number_last4, currency_code, balance, account_type, balance_updated_at, created_at';

export class BankAccountRepository implements IBankAccountRepository {
  constructor(private readonly pool: Pool) {}

  async findByCustomerId(customerId: string): Promise<BankAccountSchema[]> {
    const result = await this.pool.query<BankAccountRow>(
      `SELECT ${COLUMNS} FROM bank_accounts WHERE customer_id = $1 ORDER BY created_at`,
      [customerId],
    );
    return result.rows.map(toSchema);
  }

  async findById(id: string): Promise<BankAccountSchema | null> {
    const result = await this.pool.query<BankAccountRow>(
      `SELECT ${COLUMNS} FROM bank_accounts WHERE id = $1`,
      [id],
    );
    const row = result.rows[0];
    return row ? toSchema(row) : null;
  }

  async insert(customerId: string, input: CreateBankAccountInput): Promise<BankAccountSchema> {
    const result = await this.pool.query<BankAccountRow>(
      `INSERT INTO bank_accounts (customer_id, institution_id, account_name, account_number_last4, currency_code, balance, account_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ${COLUMNS}`,
      [
        customerId,
        input.institutionId,
        input.accountName,
        input.accountNumberLast4 ?? null,
        input.currencyCode,
        input.balance,
        input.accountType ?? null,
      ],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to insert bank account');
    return toSchema(row);
  }

  async update(id: string, input: UpdateBankAccountInput): Promise<BankAccountSchema> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.accountName !== undefined) {
      fields.push(`account_name = $${paramIndex++}`);
      values.push(input.accountName);
    }
    if (input.accountNumberLast4 !== undefined) {
      fields.push(`account_number_last4 = $${paramIndex++}`);
      values.push(input.accountNumberLast4);
    }
    if (input.balance !== undefined) {
      fields.push(`balance = $${paramIndex++}`);
      values.push(input.balance);
      fields.push('balance_updated_at = NOW()');
    }
    if (input.accountType !== undefined) {
      fields.push(`account_type = $${paramIndex++}`);
      values.push(input.accountType);
    }

    values.push(id);
    const result = await this.pool.query<BankAccountRow>(
      `UPDATE bank_accounts SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING ${COLUMNS}`,
      values,
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to update bank account');
    return toSchema(row);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM bank_accounts WHERE id = $1', [id]);
  }

  async getOverviewByCustomerId(
    customerId: string,
  ): Promise<{ currencyCode: string; total: string }[]> {
    const result = await this.pool.query<{ currency_code: string; total: string }>(
      'SELECT currency_code, SUM(balance)::TEXT as total FROM bank_accounts WHERE customer_id = $1 GROUP BY currency_code ORDER BY currency_code',
      [customerId],
    );
    return result.rows.map((row) => ({
      currencyCode: row.currency_code,
      total: row.total,
    }));
  }
}

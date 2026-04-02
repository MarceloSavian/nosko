import type { Pool } from 'pg';
import type { IBankAccountRepository } from '../../../data/domain/account/IBankAccountRepository.js';
import type {
  AccountType,
  BankAccountSchema,
  CreateBankAccountInput,
  UpdateBankAccountInput,
} from '../../../domain/models/account/Account.js';

type BankAccountRow = {
  id: string;
  institution_id: string;
  account_name: string;
  currency_code: string;
  balance: number;
  account_type: string;
  balance_updated_at: Date | null;
  created_at: Date;
};

function toSchema(row: BankAccountRow): BankAccountSchema {
  return {
    id: row.id,
    institutionId: row.institution_id,
    accountName: row.account_name,
    currencyCode: row.currency_code,
    balance: row.balance,
    accountType: row.account_type as AccountType,
    balanceUpdatedAt: row.balance_updated_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
  };
}

const COLUMNS =
  'id, institution_id, account_name, currency_code, balance, account_type, balance_updated_at, created_at';

export class BankAccountRepository implements IBankAccountRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<BankAccountSchema | null> {
    const result = await this.pool.query<BankAccountRow>(
      `SELECT ${COLUMNS} FROM bank_accounts WHERE id = $1`,
      [id],
    );
    const row = result.rows[0];
    return row ? toSchema(row) : null;
  }

  async findByIds(ids: string[]): Promise<BankAccountSchema[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const result = await this.pool.query<BankAccountRow>(
      `SELECT ${COLUMNS} FROM bank_accounts WHERE id IN (${placeholders}) ORDER BY created_at`,
      ids,
    );
    return result.rows.map(toSchema);
  }

  async insert(input: CreateBankAccountInput): Promise<BankAccountSchema> {
    const result = await this.pool.query<BankAccountRow>(
      `INSERT INTO bank_accounts (institution_id, account_name, currency_code, balance, account_type)
       VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUMNS}`,
      [
        input.institutionId,
        input.accountName,
        input.currencyCode,
        input.balance,
        input.accountType,
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

  async getOverviewByAccountIds(
    accountIds: string[],
  ): Promise<{ currencyCode: string; total: number }[]> {
    if (accountIds.length === 0) return [];
    const placeholders = accountIds.map((_, i) => `$${i + 1}`).join(', ');
    const result = await this.pool.query<{ currency_code: string; total: number }>(
      `SELECT currency_code, SUM(balance) as total FROM bank_accounts WHERE id IN (${placeholders}) GROUP BY currency_code ORDER BY currency_code`,
      accountIds,
    );
    return result.rows.map((row) => ({
      currencyCode: row.currency_code,
      total: row.total,
    }));
  }
}

import type { Pool } from 'pg';
import type { ITransactionRepository } from '../../../data/domain/transaction/ITransactionRepository.js';
import type {
  CreateTransactionInput,
  TransactionSchema,
  UpdateTransactionInput,
} from '../../../domain/models/transaction/Transaction.js';

type TransactionRow = {
  id: string;
  bank_account_id: string;
  category_id: string | null;
  budget_item_id: string | null;
  amount: number;
  description: string | null;
  transaction_date: Date;
  created_at: Date;
};

function toSchema(row: TransactionRow): TransactionSchema {
  return {
    id: row.id,
    bankAccountId: row.bank_account_id,
    categoryId: row.category_id,
    budgetItemId: row.budget_item_id,
    amount: row.amount,
    description: row.description,
    transactionDate: row.transaction_date.toISOString().split('T')[0] ?? '',
    createdAt: row.created_at.toISOString(),
  };
}

const COLUMNS =
  'id, bank_account_id, category_id, budget_item_id, amount, description, transaction_date, created_at';

export class TransactionRepository implements ITransactionRepository {
  constructor(private readonly pool: Pool) {}

  async findByFilters(filters: {
    bankAccountIds: string[];
    yearMonth?: string;
    categoryId?: string;
  }): Promise<TransactionSchema[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filters.bankAccountIds.length > 0) {
      const placeholders = filters.bankAccountIds.map(() => `$${paramIndex++}`);
      conditions.push(`bank_account_id IN (${placeholders.join(', ')})`);
      values.push(...filters.bankAccountIds);
    }

    if (filters.yearMonth) {
      conditions.push(`TO_CHAR(transaction_date, 'YYYY-MM') = $${paramIndex++}`);
      values.push(filters.yearMonth);
    }

    if (filters.categoryId) {
      conditions.push(`category_id = $${paramIndex++}`);
      values.push(filters.categoryId);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await this.pool.query<TransactionRow>(
      `SELECT ${COLUMNS} FROM transactions ${where} ORDER BY transaction_date DESC, created_at DESC`,
      values,
    );
    return result.rows.map(toSchema);
  }

  async findById(id: string): Promise<TransactionSchema | null> {
    const result = await this.pool.query<TransactionRow>(
      `SELECT ${COLUMNS} FROM transactions WHERE id = $1`,
      [id],
    );
    const row = result.rows[0];
    return row ? toSchema(row) : null;
  }

  async insert(input: CreateTransactionInput): Promise<TransactionSchema> {
    const result = await this.pool.query<TransactionRow>(
      `INSERT INTO transactions (bank_account_id, category_id, budget_item_id, amount, description, transaction_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLUMNS}`,
      [
        input.bankAccountId,
        input.categoryId ?? null,
        input.budgetItemId ?? null,
        input.amount,
        input.description ?? null,
        input.transactionDate,
      ],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to insert transaction');
    return toSchema(row);
  }

  async update(id: string, input: UpdateTransactionInput): Promise<TransactionSchema> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.categoryId !== undefined) {
      fields.push(`category_id = $${paramIndex++}`);
      values.push(input.categoryId);
    }
    if (input.budgetItemId !== undefined) {
      fields.push(`budget_item_id = $${paramIndex++}`);
      values.push(input.budgetItemId);
    }
    if (input.amount !== undefined) {
      fields.push(`amount = $${paramIndex++}`);
      values.push(input.amount);
    }
    if (input.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(input.description);
    }
    if (input.transactionDate !== undefined) {
      fields.push(`transaction_date = $${paramIndex++}`);
      values.push(input.transactionDate);
    }

    values.push(id);
    const result = await this.pool.query<TransactionRow>(
      `UPDATE transactions SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING ${COLUMNS}`,
      values,
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to update transaction');
    return toSchema(row);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM transactions WHERE id = $1', [id]);
  }
}

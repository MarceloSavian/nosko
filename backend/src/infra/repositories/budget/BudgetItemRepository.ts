import type { Pool } from 'pg';
import type { IBudgetItemRepository } from '../../../data/domain/budget/IBudgetItemRepository.js';
import type {
  BudgetItemSchema,
  CreateBudgetItemInput,
  UpdateBudgetItemInput,
} from '../../../domain/models/budget/BudgetPlan.js';

type ItemRow = {
  id: string;
  plan_id: string;
  category_id: string;
  name: string;
  planned_amount: string;
  type: string;
  recurrence: string;
  installment_total: number | null;
  installment_number: number | null;
  source_item_id: string | null;
  created_at: Date;
  updated_at: Date;
};

function toSchema(row: ItemRow): BudgetItemSchema {
  return {
    id: row.id,
    planId: row.plan_id,
    categoryId: row.category_id,
    name: row.name,
    plannedAmount: row.planned_amount,
    type: row.type,
    recurrence: row.recurrence,
    installmentTotal: row.installment_total,
    installmentNumber: row.installment_number,
    sourceItemId: row.source_item_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

const COLUMNS =
  'id, plan_id, category_id, name, planned_amount, type, recurrence, installment_total, installment_number, source_item_id, created_at, updated_at';

export class BudgetItemRepository implements IBudgetItemRepository {
  constructor(private readonly pool: Pool) {}

  async findByPlanId(planId: string): Promise<BudgetItemSchema[]> {
    const result = await this.pool.query<ItemRow>(
      `SELECT ${COLUMNS} FROM budget_items WHERE plan_id = $1 ORDER BY created_at`,
      [planId],
    );
    return result.rows.map(toSchema);
  }

  async findById(id: string): Promise<BudgetItemSchema | null> {
    const result = await this.pool.query<ItemRow>(
      `SELECT ${COLUMNS} FROM budget_items WHERE id = $1`,
      [id],
    );
    const row = result.rows[0];
    return row ? toSchema(row) : null;
  }

  async insert(
    planId: string,
    input: CreateBudgetItemInput,
    installmentNumber?: number,
    sourceItemId?: string,
  ): Promise<BudgetItemSchema> {
    const result = await this.pool.query<ItemRow>(
      `INSERT INTO budget_items (plan_id, category_id, name, planned_amount, type, recurrence, installment_total, installment_number, source_item_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING ${COLUMNS}`,
      [
        planId,
        input.categoryId,
        input.name,
        input.plannedAmount,
        input.type,
        input.recurrence,
        input.installmentTotal ?? null,
        installmentNumber ?? null,
        sourceItemId ?? null,
      ],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to insert budget item');
    return toSchema(row);
  }

  async update(id: string, input: UpdateBudgetItemInput): Promise<BudgetItemSchema> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(input.name);
    }
    if (input.plannedAmount !== undefined) {
      fields.push(`planned_amount = $${paramIndex++}`);
      values.push(input.plannedAmount);
    }
    if (input.categoryId !== undefined) {
      fields.push(`category_id = $${paramIndex++}`);
      values.push(input.categoryId);
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const result = await this.pool.query<ItemRow>(
      `UPDATE budget_items SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING ${COLUMNS}`,
      values,
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to update budget item');
    return toSchema(row);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM budget_items WHERE id = $1', [id]);
  }
}

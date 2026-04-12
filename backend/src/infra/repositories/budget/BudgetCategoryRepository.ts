import type { Pool } from 'pg';
import type { IBudgetCategoryRepository } from '../../../data/domain/budget/IBudgetCategoryRepository.js';
import type {
  BudgetCategorySchema,
  CreateBudgetCategoryInput,
  UpdateBudgetCategoryInput,
} from '../../../domain/models/budget/BudgetCategory.js';

type CategoryRow = {
  id: string;
  name: string;
  icon: string | null;
  is_system: boolean;
  created_at: Date;
};

function toSchema(row: CategoryRow): BudgetCategorySchema {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    isSystem: row.is_system,
    createdAt: row.created_at.toISOString(),
  };
}

const COLUMNS = 'id, name, icon, is_system, created_at';

export class BudgetCategoryRepository implements IBudgetCategoryRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<BudgetCategorySchema[]> {
    const result = await this.pool.query<CategoryRow>(
      `SELECT ${COLUMNS} FROM budget_categories ORDER BY is_system DESC, name`,
    );
    return result.rows.map(toSchema);
  }

  async findById(id: string): Promise<BudgetCategorySchema | null> {
    const result = await this.pool.query<CategoryRow>(
      `SELECT ${COLUMNS} FROM budget_categories WHERE id = $1`,
      [id],
    );
    const row = result.rows[0];
    return row ? toSchema(row) : null;
  }

  async insert(
    input: CreateBudgetCategoryInput & { isSystem?: boolean },
  ): Promise<BudgetCategorySchema> {
    const result = await this.pool.query<CategoryRow>(
      `INSERT INTO budget_categories (name, icon, is_system) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
      [input.name, input.icon ?? null, input.isSystem ?? false],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to insert budget category');
    return toSchema(row);
  }

  async update(id: string, input: UpdateBudgetCategoryInput): Promise<BudgetCategorySchema> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(input.name);
    }
    if (input.icon !== undefined) {
      fields.push(`icon = $${paramIndex++}`);
      values.push(input.icon);
    }

    values.push(id);
    const result = await this.pool.query<CategoryRow>(
      `UPDATE budget_categories SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING ${COLUMNS}`,
      values,
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to update budget category');
    return toSchema(row);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM budget_categories WHERE id = $1', [id]);
  }
}

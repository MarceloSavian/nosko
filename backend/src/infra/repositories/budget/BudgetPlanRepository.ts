import type { Pool } from 'pg';
import type { IBudgetPlanRepository } from '../../../data/domain/budget/IBudgetPlanRepository.js';
import type { BudgetPlanSchema } from '../../../domain/models/budget/BudgetPlan.js';

type PlanRow = {
  id: string;
  customer_id: string | null;
  partnership_id: string | null;
  year_month: string;
  currency_code: string;
  is_joint: boolean;
  created_at: Date;
  updated_at: Date;
};

function toSchema(row: PlanRow): BudgetPlanSchema {
  return {
    id: row.id,
    customerId: row.customer_id,
    partnershipId: row.partnership_id,
    yearMonth: row.year_month,
    currencyCode: row.currency_code,
    isJoint: row.is_joint,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

const COLUMNS =
  'id, customer_id, partnership_id, year_month, currency_code, is_joint, created_at, updated_at';

export class BudgetPlanRepository implements IBudgetPlanRepository {
  constructor(private readonly pool: Pool) {}

  async findByCustomerAndMonth(
    customerId: string,
    yearMonth: string,
  ): Promise<BudgetPlanSchema | null> {
    const result = await this.pool.query<PlanRow>(
      `SELECT ${COLUMNS} FROM budget_plans WHERE customer_id = $1 AND year_month = $2 AND is_joint = false`,
      [customerId, yearMonth],
    );
    const row = result.rows[0];
    return row ? toSchema(row) : null;
  }

  async findByPartnershipAndMonth(
    partnershipId: string,
    yearMonth: string,
  ): Promise<BudgetPlanSchema | null> {
    const result = await this.pool.query<PlanRow>(
      `SELECT ${COLUMNS} FROM budget_plans WHERE partnership_id = $1 AND year_month = $2 AND is_joint = true`,
      [partnershipId, yearMonth],
    );
    const row = result.rows[0];
    return row ? toSchema(row) : null;
  }

  async findById(id: string): Promise<BudgetPlanSchema | null> {
    const result = await this.pool.query<PlanRow>(
      `SELECT ${COLUMNS} FROM budget_plans WHERE id = $1`,
      [id],
    );
    const row = result.rows[0];
    return row ? toSchema(row) : null;
  }

  async insertPersonal(
    customerId: string,
    yearMonth: string,
    currencyCode: string,
  ): Promise<BudgetPlanSchema> {
    const result = await this.pool.query<PlanRow>(
      `INSERT INTO budget_plans (customer_id, year_month, currency_code, is_joint) VALUES ($1, $2, $3, false) RETURNING ${COLUMNS}`,
      [customerId, yearMonth, currencyCode],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to insert personal budget plan');
    return toSchema(row);
  }

  async insertJoint(
    partnershipId: string,
    yearMonth: string,
    currencyCode: string,
  ): Promise<BudgetPlanSchema> {
    const result = await this.pool.query<PlanRow>(
      `INSERT INTO budget_plans (partnership_id, year_month, currency_code, is_joint) VALUES ($1, $2, $3, true) RETURNING ${COLUMNS}`,
      [partnershipId, yearMonth, currencyCode],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to insert joint budget plan');
    return toSchema(row);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM budget_plans WHERE id = $1', [id]);
  }
}

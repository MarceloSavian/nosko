import type { Pool } from 'pg';
import type { IContributionRuleRepository } from '../../../data/domain/partnership/IContributionRuleRepository.js';
import type {
  ContributionRuleSchema,
  ContributionType,
} from '../../../domain/models/partnership/Partnership.js';

type RuleRow = {
  id: string;
  partnership_id: string;
  type: string;
  customer_a_percentage: string | null;
  customer_b_percentage: string | null;
  created_at: Date;
  updated_at: Date;
};

function toSchema(row: RuleRow): ContributionRuleSchema {
  return {
    id: row.id,
    partnershipId: row.partnership_id,
    type: row.type as ContributionType,
    customerAPercentage: row.customer_a_percentage,
    customerBPercentage: row.customer_b_percentage,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

const COLUMNS =
  'id, partnership_id, type, customer_a_percentage, customer_b_percentage, created_at, updated_at';

export class ContributionRuleRepository implements IContributionRuleRepository {
  constructor(private readonly pool: Pool) {}

  async findByPartnershipId(partnershipId: string): Promise<ContributionRuleSchema | null> {
    const result = await this.pool.query<RuleRow>(
      `SELECT ${COLUMNS} FROM contribution_rules WHERE partnership_id = $1`,
      [partnershipId],
    );
    const row = result.rows[0];
    return row ? toSchema(row) : null;
  }

  async upsert(
    partnershipId: string,
    type: string,
    customerAPercentage?: number,
    customerBPercentage?: number,
  ): Promise<ContributionRuleSchema> {
    const existing = await this.findByPartnershipId(partnershipId);

    if (existing) {
      const result = await this.pool.query<RuleRow>(
        `UPDATE contribution_rules SET type = $1, customer_a_percentage = $2, customer_b_percentage = $3, updated_at = NOW() WHERE partnership_id = $4 RETURNING ${COLUMNS}`,
        [type, customerAPercentage ?? null, customerBPercentage ?? null, partnershipId],
      );
      const row = result.rows[0];
      if (!row) throw new Error('Failed to update contribution rule');
      return toSchema(row);
    }

    const result = await this.pool.query<RuleRow>(
      `INSERT INTO contribution_rules (partnership_id, type, customer_a_percentage, customer_b_percentage) VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
      [partnershipId, type, customerAPercentage ?? null, customerBPercentage ?? null],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to insert contribution rule');
    return toSchema(row);
  }
}

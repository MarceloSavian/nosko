import type { Pool } from 'pg';
import type { IPartnershipRepository } from '../../../data/domain/partnership/IPartnershipRepository.js';
import type { PartnershipSchema } from '../../../domain/models/partnership/Partnership.js';

type PartnershipRow = {
  id: string;
  invitation_id: string;
  customer_a_id: string;
  customer_b_id: string;
  created_at: Date;
};

function toSchema(row: PartnershipRow): PartnershipSchema {
  return {
    id: row.id,
    invitationId: row.invitation_id,
    customerAId: row.customer_a_id,
    customerBId: row.customer_b_id,
    createdAt: row.created_at.toISOString(),
  };
}

const COLUMNS = 'id, invitation_id, customer_a_id, customer_b_id, created_at';

export class PartnershipRepository implements IPartnershipRepository {
  constructor(private readonly pool: Pool) {}

  async insert(
    invitationId: string,
    customerAId: string,
    customerBId: string,
  ): Promise<PartnershipSchema> {
    const result = await this.pool.query<PartnershipRow>(
      `INSERT INTO partnerships (invitation_id, customer_a_id, customer_b_id) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
      [invitationId, customerAId, customerBId],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to insert partnership');
    return toSchema(row);
  }

  async findByCustomerId(customerId: string): Promise<PartnershipSchema | null> {
    const result = await this.pool.query<PartnershipRow>(
      `SELECT ${COLUMNS} FROM partnerships WHERE customer_a_id = $1 OR customer_b_id = $1`,
      [customerId],
    );
    const row = result.rows[0];
    return row ? toSchema(row) : null;
  }

  async findById(id: string): Promise<PartnershipSchema | null> {
    const result = await this.pool.query<PartnershipRow>(
      `SELECT ${COLUMNS} FROM partnerships WHERE id = $1`,
      [id],
    );
    const row = result.rows[0];
    return row ? toSchema(row) : null;
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM partnerships WHERE id = $1', [id]);
  }
}

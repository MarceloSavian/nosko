import type { Pool } from 'pg';
import type { IPartnerInvitationRepository } from '../../../data/domain/partnership/IPartnerInvitationRepository.js';
import type { PartnerInvitationSchema } from '../../../domain/models/partnership/Partnership.js';

type InvitationRow = {
  id: string;
  inviter_id: string;
  invitee_email: string;
  status: string;
  accepted_at: Date | null;
  created_at: Date;
};

function toSchema(row: InvitationRow): PartnerInvitationSchema {
  return {
    id: row.id,
    inviterId: row.inviter_id,
    inviteeEmail: row.invitee_email,
    status: row.status,
    acceptedAt: row.accepted_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
  };
}

const COLUMNS = 'id, inviter_id, invitee_email, status, accepted_at, created_at';

export class PartnerInvitationRepository implements IPartnerInvitationRepository {
  constructor(private readonly pool: Pool) {}

  async insert(inviterId: string, inviteeEmail: string): Promise<PartnerInvitationSchema> {
    const result = await this.pool.query<InvitationRow>(
      `INSERT INTO partner_invitations (inviter_id, invitee_email) VALUES ($1, $2) RETURNING ${COLUMNS}`,
      [inviterId, inviteeEmail],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to insert invitation');
    return toSchema(row);
  }

  async findById(id: string): Promise<PartnerInvitationSchema | null> {
    const result = await this.pool.query<InvitationRow>(
      `SELECT ${COLUMNS} FROM partner_invitations WHERE id = $1`,
      [id],
    );
    const row = result.rows[0];
    return row ? toSchema(row) : null;
  }

  async findByCustomerId(customerId: string): Promise<PartnerInvitationSchema[]> {
    const result = await this.pool.query<InvitationRow>(
      `SELECT ${COLUMNS} FROM partner_invitations WHERE inviter_id = $1 OR invitee_email = (SELECT email FROM customers WHERE id = $1) ORDER BY created_at DESC`,
      [customerId],
    );
    return result.rows.map(toSchema);
  }

  async updateStatus(
    id: string,
    status: string,
    acceptedAt?: Date,
  ): Promise<PartnerInvitationSchema> {
    const result = await this.pool.query<InvitationRow>(
      `UPDATE partner_invitations SET status = $1, accepted_at = $2 WHERE id = $3 RETURNING ${COLUMNS}`,
      [status, acceptedAt ?? null, id],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to update invitation');
    return toSchema(row);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM partner_invitations WHERE id = $1', [id]);
  }
}

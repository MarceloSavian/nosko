import type { Pool } from 'pg';
import type { ISharedAccountRepository } from '../../../data/domain/partnership/ISharedAccountRepository.js';
import type { SharedAccountSchema } from '../../../domain/models/partnership/Partnership.js';

type SharedAccountRow = {
  id: string;
  partnership_id: string;
  bank_account_id: string;
  shared_by_customer_id: string;
  created_at: Date;
};

function toSchema(row: SharedAccountRow): SharedAccountSchema {
  return {
    id: row.id,
    partnershipId: row.partnership_id,
    bankAccountId: row.bank_account_id,
    sharedByCustomerId: row.shared_by_customer_id,
    createdAt: row.created_at.toISOString(),
  };
}

const COLUMNS = 'id, partnership_id, bank_account_id, shared_by_customer_id, created_at';

export class SharedAccountRepository implements ISharedAccountRepository {
  constructor(private readonly pool: Pool) {}

  async findByPartnershipId(partnershipId: string): Promise<SharedAccountSchema[]> {
    const result = await this.pool.query<SharedAccountRow>(
      `SELECT ${COLUMNS} FROM shared_accounts WHERE partnership_id = $1 ORDER BY created_at`,
      [partnershipId],
    );
    return result.rows.map(toSchema);
  }

  async replaceAll(
    partnershipId: string,
    sharedByCustomerId: string,
    bankAccountIds: string[],
  ): Promise<SharedAccountSchema[]> {
    await this.pool.query(
      'DELETE FROM shared_accounts WHERE partnership_id = $1 AND shared_by_customer_id = $2',
      [partnershipId, sharedByCustomerId],
    );

    const results: SharedAccountSchema[] = [];
    for (const bankAccountId of bankAccountIds) {
      const result = await this.pool.query<SharedAccountRow>(
        `INSERT INTO shared_accounts (partnership_id, bank_account_id, shared_by_customer_id) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
        [partnershipId, bankAccountId, sharedByCustomerId],
      );
      const row = result.rows[0];
      if (row) results.push(toSchema(row));
    }

    return results;
  }
}

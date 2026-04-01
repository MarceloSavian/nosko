import type { Pool } from 'pg';
import type { IVerificationTokenRepository } from '../../../data/domain/customer/IVerificationTokenRepository.js';

export class VerificationTokenRepository implements IVerificationTokenRepository {
  constructor(private readonly pool: Pool) {}

  async insert(customerId: string, code: string, expiresAt: Date): Promise<void> {
    await this.pool.query(
      'INSERT INTO verification_tokens (customer_id, code, expires_at) VALUES ($1, $2, $3)',
      [customerId, code, expiresAt],
    );
  }

  async find(customerId: string, code: string): Promise<{ id: string; expiresAt: Date } | null> {
    const result = await this.pool.query<{ id: string; expires_at: Date }>(
      'SELECT id, expires_at FROM verification_tokens WHERE customer_id = $1 AND code = $2',
      [customerId, code],
    );

    const row = result.rows[0];
    if (!row) return null;

    return { id: row.id, expiresAt: row.expires_at };
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM verification_tokens WHERE id = $1', [id]);
  }
}

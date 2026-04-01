import type { Pool } from 'pg';
import type { TokenType } from '../../../domain/models/customer/Customer.js';
import type { ITokenRepository } from '../../../data/domain/customer/ITokenRepository.js';

export class TokenRepository implements ITokenRepository {
  constructor(private readonly pool: Pool) {}

  async insert(customerId: string, code: string, type: TokenType, expiresAt: Date): Promise<void> {
    await this.pool.query(
      'INSERT INTO tokens (customer_id, code, type, expires_at) VALUES ($1, $2, $3, $4)',
      [customerId, code, type, expiresAt],
    );
  }

  async find(customerId: string, code: string, type: TokenType): Promise<{ id: string; expiresAt: Date } | null> {
    const result = await this.pool.query<{ id: string; expires_at: Date }>(
      'SELECT id, expires_at FROM tokens WHERE customer_id = $1 AND code = $2 AND type = $3',
      [customerId, code, type],
    );

    const row = result.rows[0];
    if (!row) return null;

    return { id: row.id, expiresAt: row.expires_at };
  }

  async deleteByCustomerAndType(customerId: string, type: TokenType): Promise<void> {
    await this.pool.query('DELETE FROM tokens WHERE customer_id = $1 AND type = $2', [customerId, type]);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM tokens WHERE id = $1', [id]);
  }
}

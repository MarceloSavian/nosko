import type { Pool } from 'pg';
import type { IAdminTokenRepository } from '../../../data/domain/admin/IAdminTokenRepository.js';
import type { AdminTokenType } from '../../../domain/models/admin/Admin.js';

export class AdminTokenRepository implements IAdminTokenRepository {
  constructor(private readonly pool: Pool) {}

  async insert(adminId: string, code: string, type: AdminTokenType, expiresAt: Date): Promise<void> {
    await this.pool.query(
      'INSERT INTO admin_tokens (admin_id, code, type, expires_at) VALUES ($1, $2, $3, $4)',
      [adminId, code, type, expiresAt],
    );
  }

  async find(
    adminId: string,
    code: string,
    type: AdminTokenType,
  ): Promise<{ id: string; expiresAt: Date } | null> {
    const result = await this.pool.query<{ id: string; expires_at: Date }>(
      'SELECT id, expires_at FROM admin_tokens WHERE admin_id = $1 AND code = $2 AND type = $3',
      [adminId, code, type],
    );
    const row = result.rows[0];
    if (!row) return null;
    return { id: row.id, expiresAt: row.expires_at };
  }

  async deleteByAdminAndType(adminId: string, type: AdminTokenType): Promise<void> {
    await this.pool.query('DELETE FROM admin_tokens WHERE admin_id = $1 AND type = $2', [
      adminId,
      type,
    ]);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM admin_tokens WHERE id = $1', [id]);
  }
}

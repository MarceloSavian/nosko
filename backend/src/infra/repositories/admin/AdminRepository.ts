import type { Pool } from 'pg';
import type { IAdminRepository } from '../../../data/domain/admin/IAdminRepository.js';
import type { AdminSchema } from '../../../domain/models/admin/Admin.js';

type AdminRow = {
  id: string;
  email: string;
  name: string;
  created_at: Date;
};

const COLUMNS = 'id, email, name, created_at';

function toSchema(row: AdminRow): AdminSchema {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at.toISOString(),
  };
}

export class AdminRepository implements IAdminRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<AdminSchema[]> {
    const result = await this.pool.query<AdminRow>(
      `SELECT ${COLUMNS} FROM admins ORDER BY created_at`,
    );
    return result.rows.map(toSchema);
  }

  async findById(id: string): Promise<AdminSchema | null> {
    const result = await this.pool.query<AdminRow>(`SELECT ${COLUMNS} FROM admins WHERE id = $1`, [
      id,
    ]);
    const row = result.rows[0];
    return row ? toSchema(row) : null;
  }

  async findByEmail(email: string): Promise<AdminSchema | null> {
    const result = await this.pool.query<AdminRow>(
      `SELECT ${COLUMNS} FROM admins WHERE email = $1`,
      [email],
    );
    const row = result.rows[0];
    return row ? toSchema(row) : null;
  }

  async findByEmailWithPassword(
    email: string,
  ): Promise<(AdminSchema & { passwordHash: string | null }) | null> {
    const result = await this.pool.query<AdminRow & { password_hash: string | null }>(
      `SELECT ${COLUMNS}, password_hash FROM admins WHERE email = $1`,
      [email],
    );
    const row = result.rows[0];
    if (!row) return null;
    return { ...toSchema(row), passwordHash: row.password_hash };
  }

  async insert(data: { email: string; passwordHash: string; name: string }): Promise<AdminSchema> {
    const result = await this.pool.query<AdminRow>(
      `INSERT INTO admins (email, password_hash, name) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
      [data.email, data.passwordHash, data.name],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to insert admin');
    return toSchema(row);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.pool.query('UPDATE admins SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
  }

  async deleteById(id: string): Promise<void> {
    await this.pool.query('DELETE FROM admins WHERE id = $1', [id]);
  }
}

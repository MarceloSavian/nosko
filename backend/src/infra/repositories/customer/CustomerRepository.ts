import type { Pool } from 'pg';
import type { ICustomerRepository } from '../../../data/domain/customer/ICustomerRepository.js';
import type {
  CustomerSchema,
  UpdateProfileInput,
} from '../../../domain/models/customer/Customer.js';

type CustomerRow = {
  id: string;
  email: string;
  name: string | null;
  language: string;
  avatar_url: string | null;
  verified_at: Date | null;
  created_at: Date;
};

const CUSTOMER_COLUMNS = 'id, email, name, language, avatar_url, verified_at, created_at';

function toSchema(row: CustomerRow): CustomerSchema {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    language: row.language,
    avatarUrl: row.avatar_url,
    verifiedAt: row.verified_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
  };
}

export class CustomerRepository implements ICustomerRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<CustomerSchema | null> {
    const result = await this.pool.query<CustomerRow>(
      `SELECT ${CUSTOMER_COLUMNS} FROM customers WHERE id = $1`,
      [id],
    );

    const row = result.rows[0];
    if (!row) return null;

    return toSchema(row);
  }

  async findByEmail(email: string): Promise<CustomerSchema | null> {
    const result = await this.pool.query<CustomerRow>(
      `SELECT ${CUSTOMER_COLUMNS} FROM customers WHERE email = $1`,
      [email],
    );

    const row = result.rows[0];
    if (!row) return null;

    return toSchema(row);
  }

  async findByEmailWithPassword(
    email: string,
  ): Promise<(CustomerSchema & { passwordHash: string }) | null> {
    const result = await this.pool.query<CustomerRow & { password_hash: string }>(
      `SELECT ${CUSTOMER_COLUMNS}, password_hash FROM customers WHERE email = $1`,
      [email],
    );

    const row = result.rows[0];
    if (!row) return null;

    return { ...toSchema(row), passwordHash: row.password_hash };
  }

  async insert(data: {
    email: string;
    passwordHash: string;
    name: string;
    language: string;
  }): Promise<CustomerSchema> {
    const result = await this.pool.query<CustomerRow>(
      `INSERT INTO customers (email, password_hash, name, language) VALUES ($1, $2, $3, $4) RETURNING ${CUSTOMER_COLUMNS}`,
      [data.email, data.passwordHash, data.name, data.language],
    );

    const row = result.rows[0];
    if (!row) throw new Error('Failed to insert customer');

    return toSchema(row);
  }

  async markVerified(id: string): Promise<CustomerSchema> {
    const result = await this.pool.query<CustomerRow>(
      `UPDATE customers SET verified_at = NOW() WHERE id = $1 RETURNING ${CUSTOMER_COLUMNS}`,
      [id],
    );

    const row = result.rows[0];
    if (!row) throw new Error('Failed to mark customer as verified');

    return toSchema(row);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.pool.query('UPDATE customers SET password_hash = $1 WHERE id = $2', [
      passwordHash,
      id,
    ]);
  }

  async updateProfile(id: string, input: UpdateProfileInput): Promise<CustomerSchema> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(input.name);
    }
    if (input.language !== undefined) {
      fields.push(`language = $${paramIndex++}`);
      values.push(input.language);
    }
    if (input.avatarUrl !== undefined) {
      fields.push(`avatar_url = $${paramIndex++}`);
      values.push(input.avatarUrl);
    }

    values.push(id);
    const result = await this.pool.query<CustomerRow>(
      `UPDATE customers SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING ${CUSTOMER_COLUMNS}`,
      values,
    );

    const row = result.rows[0];
    if (!row) throw new Error('Failed to update customer profile');

    return toSchema(row);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM customers WHERE id = $1', [id]);
  }

  async findAllPaginated(limit: number, offset: number): Promise<CustomerSchema[]> {
    const result = await this.pool.query<CustomerRow>(
      `SELECT ${CUSTOMER_COLUMNS} FROM customers ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return result.rows.map(toSchema);
  }

  async count(): Promise<number> {
    const result = await this.pool.query<{ count: string }>('SELECT COUNT(*) FROM customers');
    return Number(result.rows[0]?.count ?? 0);
  }
}

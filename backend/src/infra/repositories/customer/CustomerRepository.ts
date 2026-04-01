import type { Pool } from 'pg';
import type { ICustomerRepository } from '../../../data/domain/customer/ICustomerRepository.js';
import type { CustomerSchema } from '../../../domain/models/customer/Customer.js';

type CustomerRow = { id: string; email: string; verified_at: Date | null; created_at: Date };

function toSchema(row: CustomerRow): CustomerSchema {
  return {
    id: row.id,
    email: row.email,
    verifiedAt: row.verified_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
  };
}

export class CustomerRepository implements ICustomerRepository {
  constructor(private readonly pool: Pool) {}

  async findByEmail(email: string): Promise<CustomerSchema | null> {
    const result = await this.pool.query<CustomerRow>(
      'SELECT id, email, verified_at, created_at FROM customers WHERE email = $1',
      [email],
    );

    const row = result.rows[0];
    if (!row) return null;

    return toSchema(row);
  }

  async findByEmailWithPassword(email: string): Promise<(CustomerSchema & { passwordHash: string }) | null> {
    const result = await this.pool.query<CustomerRow & { password_hash: string }>(
      'SELECT id, email, password_hash, verified_at, created_at FROM customers WHERE email = $1',
      [email],
    );

    const row = result.rows[0];
    if (!row) return null;

    return { ...toSchema(row), passwordHash: row.password_hash };
  }

  async insert(data: { email: string; passwordHash: string }): Promise<CustomerSchema> {
    const result = await this.pool.query<CustomerRow>(
      'INSERT INTO customers (email, password_hash) VALUES ($1, $2) RETURNING id, email, verified_at, created_at',
      [data.email, data.passwordHash],
    );

    const row = result.rows[0];
    if (!row) throw new Error('Failed to insert customer');

    return toSchema(row);
  }

  async markVerified(id: string): Promise<CustomerSchema> {
    const result = await this.pool.query<CustomerRow>(
      'UPDATE customers SET verified_at = NOW() WHERE id = $1 RETURNING id, email, verified_at, created_at',
      [id],
    );

    const row = result.rows[0];
    if (!row) throw new Error('Failed to mark customer as verified');

    return toSchema(row);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.pool.query('UPDATE customers SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
  }
}

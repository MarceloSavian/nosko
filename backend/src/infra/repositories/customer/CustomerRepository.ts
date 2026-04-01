import type { Pool } from 'pg';
import type { ICustomerRepository } from '../../../data/domain/customer/ICustomerRepository.js';
import type { CustomerSchema } from '../../../domain/models/customer/Customer.js';

export class CustomerRepository implements ICustomerRepository {
  constructor(private readonly pool: Pool) {}

  async findByEmail(email: string): Promise<CustomerSchema | null> {
    const result = await this.pool.query<{ id: string; email: string; created_at: Date }>(
      'SELECT id, email, created_at FROM customers WHERE email = $1',
      [email],
    );

    const row = result.rows[0];
    if (!row) return null;

    return { id: row.id, email: row.email, createdAt: row.created_at.toISOString() };
  }

  async insert(data: { email: string; passwordHash: string }): Promise<CustomerSchema> {
    const result = await this.pool.query<{ id: string; email: string; created_at: Date }>(
      'INSERT INTO customers (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [data.email, data.passwordHash],
    );

    const row = result.rows[0];
    if (!row) throw new Error('Failed to insert customer');

    return { id: row.id, email: row.email, createdAt: row.created_at.toISOString() };
  }
}

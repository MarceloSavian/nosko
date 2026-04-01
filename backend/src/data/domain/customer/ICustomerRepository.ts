import type { CustomerSchema } from '../../../domain/models/customer/Customer.js';

export interface ICustomerRepository {
  findByEmail(email: string): Promise<CustomerSchema | null>;
  insert(data: { email: string; passwordHash: string }): Promise<CustomerSchema>;
}

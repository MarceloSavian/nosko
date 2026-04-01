import type { CustomerSchema } from '../../../domain/models/customer/Customer.js';

export interface ICustomerRepository {
  findById(id: string): Promise<CustomerSchema | null>;
  findByEmail(email: string): Promise<CustomerSchema | null>;
  findByEmailWithPassword(
    email: string,
  ): Promise<(CustomerSchema & { passwordHash: string }) | null>;
  insert(data: { email: string; passwordHash: string }): Promise<CustomerSchema>;
  markVerified(id: string): Promise<CustomerSchema>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
}

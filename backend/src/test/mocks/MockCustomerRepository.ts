import { mock } from 'node:test';
import type { ICustomerRepository } from '../../data/domain/customer/ICustomerRepository.js';
import type { CustomerSchema } from '../../domain/models/customer/Customer.js';

class MockCustomerRepository implements ICustomerRepository {
  findById = mock.fn(async (_id: string): Promise<CustomerSchema | null> => null);
  findByEmail = mock.fn(async (_email: string): Promise<CustomerSchema | null> => null);
  findByEmailWithPassword = mock.fn(
    async (_email: string): Promise<(CustomerSchema & { passwordHash: string }) | null> => null,
  );
  insert = mock.fn(
    async (_data: { email: string; passwordHash: string }): Promise<CustomerSchema> => ({
      id: '',
      email: '',
      verifiedAt: null,
      createdAt: '',
    }),
  );
  markVerified = mock.fn(
    async (_id: string): Promise<CustomerSchema> => ({
      id: '',
      email: '',
      verifiedAt: null,
      createdAt: '',
    }),
  );
  updatePassword = mock.fn(async (_id: string, _passwordHash: string): Promise<void> => {});
}

export const mockCustomerRepository = new MockCustomerRepository();

import { mock } from 'node:test';
import type { ICustomerRepository } from '../../data/domain/customer/ICustomerRepository.js';
import type { CustomerSchema, UpdateProfileInput } from '../../domain/models/customer/Customer.js';

const defaultCustomer: CustomerSchema = {
  id: '',
  email: '',
  name: null,
  language: 'en',
  avatarUrl: null,
  verifiedAt: null,
  createdAt: '',
};

class MockCustomerRepository implements ICustomerRepository {
  findById = mock.fn(async (_id: string): Promise<CustomerSchema | null> => null);
  findByEmail = mock.fn(async (_email: string): Promise<CustomerSchema | null> => null);
  findByEmailWithPassword = mock.fn(
    async (_email: string): Promise<(CustomerSchema & { passwordHash: string }) | null> => null,
  );
  insert = mock.fn(
    async (_data: { email: string; passwordHash: string }): Promise<CustomerSchema> => ({
      ...defaultCustomer,
    }),
  );
  markVerified = mock.fn(
    async (_id: string): Promise<CustomerSchema> => ({
      ...defaultCustomer,
    }),
  );
  updatePassword = mock.fn(async (_id: string, _passwordHash: string): Promise<void> => {});
  updateProfile = mock.fn(
    async (_id: string, _input: UpdateProfileInput): Promise<CustomerSchema> => ({
      ...defaultCustomer,
    }),
  );
  delete = mock.fn(async (_id: string): Promise<void> => {});
}

export const mockCustomerRepository = new MockCustomerRepository();

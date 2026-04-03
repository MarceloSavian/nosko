import { mock } from 'node:test';
import type { CustomerSchema, UpdateProfileInput } from '../../domain/models/customer/Customer.js';
import type { IProfileService } from '../../domain/usecases/profile/IProfileService.js';

const defaultCustomer: CustomerSchema = {
  id: '',
  email: '',
  name: null,
  language: 'en-US',
  avatarUrl: null,
  verifiedAt: null,
  createdAt: '',
};

class MockProfileService implements IProfileService {
  getProfile = mock.fn(
    async (_customerId: string): Promise<CustomerSchema> => ({
      ...defaultCustomer,
    }),
  );
  updateProfile = mock.fn(
    async (_customerId: string, _input: UpdateProfileInput): Promise<CustomerSchema> => ({
      ...defaultCustomer,
    }),
  );
  deleteAccount = mock.fn(async (_customerId: string): Promise<void> => {});
}

export const mockProfileService = new MockProfileService();

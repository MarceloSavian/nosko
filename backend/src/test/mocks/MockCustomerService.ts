import { mock } from 'node:test';
import type { ICustomerService } from '../../domain/usecases/customer/ICustomerService.js';
import type { CustomerSchema, LoginResult, SignupInput, LoginInput, VerifyEmailInput } from '../../domain/models/customer/Customer.js';

class MockCustomerService implements ICustomerService {
  signup = mock.fn(async (_input: SignupInput): Promise<CustomerSchema> => ({
    id: '',
    email: '',
    verifiedAt: null,
    createdAt: '',
  }));
  login = mock.fn(async (_input: LoginInput): Promise<LoginResult> => ({ accessToken: '' }));
  verifyEmail = mock.fn(async (_input: VerifyEmailInput): Promise<CustomerSchema> => ({
    id: '',
    email: '',
    verifiedAt: null,
    createdAt: '',
  }));
}

export const mockCustomerService = new MockCustomerService();

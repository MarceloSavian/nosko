import { mock } from 'node:test';
import type {
  CustomerSchema,
  LoginInput,
  LoginResult,
  RequestPasswordResetInput,
  ResendVerificationInput,
  ResetPasswordInput,
  SignupInput,
  VerifyEmailInput,
} from '../../domain/models/customer/Customer.js';
import type { ICustomerService } from '../../domain/usecases/customer/ICustomerService.js';

class MockCustomerService implements ICustomerService {
  signup = mock.fn(
    async (_input: SignupInput): Promise<CustomerSchema> => ({
      id: '',
      email: '',
      verifiedAt: null,
      createdAt: '',
    }),
  );
  login = mock.fn(async (_input: LoginInput): Promise<LoginResult> => ({ accessToken: '' }));
  verifyEmail = mock.fn(
    async (_input: VerifyEmailInput): Promise<CustomerSchema> => ({
      id: '',
      email: '',
      verifiedAt: null,
      createdAt: '',
    }),
  );
  resendVerification = mock.fn(async (_input: ResendVerificationInput): Promise<void> => {});
  requestPasswordReset = mock.fn(async (_input: RequestPasswordResetInput): Promise<void> => {});
  resetPassword = mock.fn(async (_input: ResetPasswordInput): Promise<void> => {});
}

export const mockCustomerService = new MockCustomerService();

import type {
  CustomerSchema,
  LoginInput,
  LoginResult,
  RequestPasswordResetInput,
  ResendVerificationInput,
  ResetPasswordInput,
  SignupInput,
  VerifyEmailInput,
} from '../../models/customer/Customer.js';

export interface ICustomerService {
  signup(input: SignupInput): Promise<CustomerSchema>;
  login(input: LoginInput): Promise<LoginResult>;
  verifyEmail(input: VerifyEmailInput): Promise<CustomerSchema>;
  resendVerification(input: ResendVerificationInput): Promise<void>;
  requestPasswordReset(input: RequestPasswordResetInput): Promise<void>;
  resetPassword(input: ResetPasswordInput): Promise<void>;
}

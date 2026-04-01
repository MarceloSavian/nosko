import type { CustomerSchema, LoginInput, LoginResult, SignupInput, VerifyEmailInput } from '../../models/customer/Customer.js';

export interface ICustomerService {
  signup(input: SignupInput): Promise<CustomerSchema>;
  login(input: LoginInput): Promise<LoginResult>;
  verifyEmail(input: VerifyEmailInput): Promise<CustomerSchema>;
}

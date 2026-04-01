import type { CustomerSchema, SignupInput } from '../../models/customer/Customer.js';

export interface ICustomerService {
  signup(input: SignupInput): Promise<CustomerSchema>;
}

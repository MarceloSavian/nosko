import type { CustomerSchema, UpdateProfileInput } from '../../models/customer/Customer.js';

export interface IProfileService {
  getProfile(customerId: string): Promise<CustomerSchema>;
  updateProfile(customerId: string, input: UpdateProfileInput): Promise<CustomerSchema>;
  deleteAccount(customerId: string): Promise<void>;
}

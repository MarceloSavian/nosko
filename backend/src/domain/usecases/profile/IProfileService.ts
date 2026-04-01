import type { CustomerSchema } from '../../models/customer/Customer.js';

export interface IProfileService {
  getProfile(customerId: string): Promise<CustomerSchema>;
}

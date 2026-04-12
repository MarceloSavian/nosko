import type { CustomerSchema } from '../../models/customer/Customer.js';

export interface IAdminCustomerService {
  listCustomers(limit: number, offset: number): Promise<{ customers: CustomerSchema[]; total: number }>;
  getCustomer(id: string): Promise<CustomerSchema>;
  deleteCustomer(id: string): Promise<void>;
}

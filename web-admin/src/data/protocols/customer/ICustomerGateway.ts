import type { CustomerListResult } from '@/domain/models/customer/Customer';

export interface ICustomerGateway {
  list(limit: number, offset: number): Promise<CustomerListResult>;
  delete(id: string): Promise<void>;
}

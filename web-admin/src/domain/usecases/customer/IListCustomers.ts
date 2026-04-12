import type { CustomerListResult } from '@/domain/models/customer/Customer';

export interface IListCustomers {
  execute(limit: number, offset: number): Promise<CustomerListResult>;
}

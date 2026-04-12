import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { ICustomerGateway } from '@/data/protocols/customer/ICustomerGateway';
import type { CustomerListResult } from '@/domain/models/customer/Customer';
import type { IListCustomers } from '@/domain/usecases/customer/IListCustomers';

export class RemoteListCustomers implements IListCustomers {
  private readonly gateway: ICustomerGateway;

  constructor(gateway: ICustomerGateway) {
    this.gateway = gateway;
  }

  async execute(limit: number, offset: number): Promise<CustomerListResult> {
    try {
      return await this.gateway.list(limit, offset);
    } catch (error) {
      rethrowKnown(error);
    }
  }
}

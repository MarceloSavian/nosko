import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { ICustomerGateway } from '@/data/protocols/customer/ICustomerGateway';
import type { IDeleteCustomer } from '@/domain/usecases/customer/IDeleteCustomer';

export class RemoteDeleteCustomer implements IDeleteCustomer {
  private readonly gateway: ICustomerGateway;

  constructor(gateway: ICustomerGateway) {
    this.gateway = gateway;
  }

  async execute(id: string): Promise<void> {
    try {
      await this.gateway.delete(id);
    } catch (error) {
      rethrowKnown(error);
    }
  }
}

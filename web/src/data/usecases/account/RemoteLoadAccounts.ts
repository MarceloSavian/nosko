import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IAccountGateway } from '@/data/protocols/account/IAccountGateway';
import type { BankAccount } from '@/domain/models/account/Account';
import type { ILoadAccounts } from '@/domain/usecases/account/ILoadAccounts';

export class RemoteLoadAccounts implements ILoadAccounts {
  private readonly gateway: IAccountGateway;

  constructor(gateway: IAccountGateway) {
    this.gateway = gateway;
  }

  async execute(): Promise<BankAccount[]> {
    try {
      return await this.gateway.loadAll();
    } catch (error) {
      rethrowKnown(error);
    }
  }
}

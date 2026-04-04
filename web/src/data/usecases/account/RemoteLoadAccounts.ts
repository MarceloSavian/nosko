import type { IAccountGateway } from '@/data/protocols/account/IAccountGateway';
import { UnexpectedError } from '@/domain/errors/account';
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
    } catch {
      throw new UnexpectedError();
    }
  }
}

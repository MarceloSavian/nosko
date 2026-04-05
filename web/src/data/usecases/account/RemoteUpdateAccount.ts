import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IAccountGateway } from '@/data/protocols/account/IAccountGateway';
import type { BankAccount, UpdateBankAccountInput } from '@/domain/models/account/Account';
import type { IUpdateAccount } from '@/domain/usecases/account/IUpdateAccount';

export class RemoteUpdateAccount implements IUpdateAccount {
  private readonly gateway: IAccountGateway;

  constructor(gateway: IAccountGateway) {
    this.gateway = gateway;
  }

  async execute(id: string, input: UpdateBankAccountInput): Promise<BankAccount> {
    try {
      return await this.gateway.update(id, input);
    } catch (error) {
      rethrowKnown(error);
    }
  }
}

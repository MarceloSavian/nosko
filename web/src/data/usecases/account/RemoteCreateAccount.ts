import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IAccountGateway } from '@/data/protocols/account/IAccountGateway';
import type { BankAccount, CreateBankAccountInput } from '@/domain/models/account/Account';
import type { ICreateAccount } from '@/domain/usecases/account/ICreateAccount';

export class RemoteCreateAccount implements ICreateAccount {
  private readonly gateway: IAccountGateway;

  constructor(gateway: IAccountGateway) {
    this.gateway = gateway;
  }

  async execute(input: CreateBankAccountInput): Promise<BankAccount> {
    try {
      return await this.gateway.create(input);
    } catch (error) {
      rethrowKnown(error);
    }
  }
}

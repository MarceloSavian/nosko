import type { IAccountGateway } from '@/data/protocols/account/IAccountGateway';
import { UnexpectedError } from '@/domain/errors/account';
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
    } catch {
      throw new UnexpectedError();
    }
  }
}

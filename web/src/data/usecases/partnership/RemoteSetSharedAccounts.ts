import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import type { BankAccount, SetSharedAccountsInput } from '@/domain/models/partnership/Partnership';
import type { ISetSharedAccounts } from '@/domain/usecases/partnership/ISetSharedAccounts';

export class RemoteSetSharedAccounts implements ISetSharedAccounts {
  private readonly gateway: IPartnershipGateway;

  constructor(gateway: IPartnershipGateway) {
    this.gateway = gateway;
  }

  async execute(input: SetSharedAccountsInput): Promise<BankAccount[]> {
    try {
      return await this.gateway.setSharedAccounts(input);
    } catch {
      throw new UnexpectedError();
    }
  }
}

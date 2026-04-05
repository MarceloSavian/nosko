import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import type { BankAccount } from '@/domain/models/partnership/Partnership';
import type { ILoadAccounts } from '@/domain/usecases/partnership/ILoadAccounts';

export class RemoteLoadAccounts implements ILoadAccounts {
  private readonly gateway: IPartnershipGateway;

  constructor(gateway: IPartnershipGateway) {
    this.gateway = gateway;
  }

  async execute(): Promise<BankAccount[]> {
    try {
      return await this.gateway.loadAccounts();
    } catch (error) {
      rethrowKnown(error);
    }
  }
}

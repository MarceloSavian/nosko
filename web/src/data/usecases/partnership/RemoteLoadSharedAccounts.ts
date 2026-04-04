import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import type { BankAccount } from '@/domain/models/partnership/Partnership';
import type { ILoadSharedAccounts } from '@/domain/usecases/partnership/ILoadSharedAccounts';

export class RemoteLoadSharedAccounts implements ILoadSharedAccounts {
  private readonly gateway: IPartnershipGateway;

  constructor(gateway: IPartnershipGateway) {
    this.gateway = gateway;
  }

  async execute(): Promise<BankAccount[]> {
    try {
      return await this.gateway.loadSharedAccounts();
    } catch {
      throw new UnexpectedError();
    }
  }
}

import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IProfileGateway } from '@/data/protocols/profile/IProfileGateway';
import type { IDeleteAccount } from '@/domain/usecases/profile/IDeleteAccount';

export class RemoteDeleteAccount implements IDeleteAccount {
  private readonly gateway: IProfileGateway;

  constructor(gateway: IProfileGateway) {
    this.gateway = gateway;
  }

  async execute(): Promise<void> {
    try {
      await this.gateway.deleteAccount();
    } catch (error) {
      rethrowKnown(error);
    }
  }
}

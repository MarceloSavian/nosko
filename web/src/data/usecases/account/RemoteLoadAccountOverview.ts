import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IAccountGateway } from '@/data/protocols/account/IAccountGateway';
import type { AccountOverview } from '@/domain/models/account/Account';
import type { ILoadAccountOverview } from '@/domain/usecases/account/ILoadAccountOverview';

export class RemoteLoadAccountOverview implements ILoadAccountOverview {
  private readonly gateway: IAccountGateway;

  constructor(gateway: IAccountGateway) {
    this.gateway = gateway;
  }

  async execute(): Promise<AccountOverview> {
    try {
      return await this.gateway.loadOverview();
    } catch (error) {
      rethrowKnown(error);
    }
  }
}

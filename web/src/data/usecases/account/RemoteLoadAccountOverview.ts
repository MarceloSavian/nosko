import type { IAccountGateway } from '@/data/protocols/account/IAccountGateway';
import { UnexpectedError } from '@/domain/errors/account';
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
    } catch {
      throw new UnexpectedError();
    }
  }
}

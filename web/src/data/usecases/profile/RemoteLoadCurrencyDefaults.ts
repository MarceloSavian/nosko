import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IProfileGateway } from '@/data/protocols/profile/IProfileGateway';
import type { CurrencyDefaultSchema } from '@/domain/models/profile/Profile';
import type { ILoadCurrencyDefaults } from '@/domain/usecases/profile/ILoadCurrencyDefaults';

export class RemoteLoadCurrencyDefaults implements ILoadCurrencyDefaults {
  private readonly gateway: IProfileGateway;

  constructor(gateway: IProfileGateway) {
    this.gateway = gateway;
  }

  async execute(): Promise<CurrencyDefaultSchema[]> {
    try {
      return await this.gateway.loadCurrencyDefaults();
    } catch (error) {
      rethrowKnown(error);
    }
  }
}

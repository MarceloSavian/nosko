import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IProfileGateway } from '@/data/protocols/profile/IProfileGateway';
import type {
  CurrencyDefaultSchema,
  SetCurrencyDefaultsInput,
} from '@/domain/models/profile/Profile';
import type { ISetCurrencyDefaults } from '@/domain/usecases/profile/ISetCurrencyDefaults';

export class RemoteSetCurrencyDefaults implements ISetCurrencyDefaults {
  private readonly gateway: IProfileGateway;

  constructor(gateway: IProfileGateway) {
    this.gateway = gateway;
  }

  async execute(input: SetCurrencyDefaultsInput): Promise<CurrencyDefaultSchema[]> {
    try {
      return await this.gateway.setCurrencyDefaults(input);
    } catch (error) {
      rethrowKnown(error);
    }
  }
}

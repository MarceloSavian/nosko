import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IProfileGateway } from '@/data/protocols/profile/IProfileGateway';
import type { CustomerSchema } from '@/domain/models/profile/Profile';
import type { ILoadProfile } from '@/domain/usecases/profile/ILoadProfile';

export class RemoteLoadProfile implements ILoadProfile {
  private readonly gateway: IProfileGateway;

  constructor(gateway: IProfileGateway) {
    this.gateway = gateway;
  }

  async execute(): Promise<CustomerSchema> {
    try {
      return await this.gateway.loadProfile();
    } catch (error) {
      rethrowKnown(error);
    }
  }
}

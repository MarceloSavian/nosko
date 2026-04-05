import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IProfileGateway } from '@/data/protocols/profile/IProfileGateway';
import type { CustomerSchema, UpdateProfileInput } from '@/domain/models/profile/Profile';
import type { IUpdateProfile } from '@/domain/usecases/profile/IUpdateProfile';

export class RemoteUpdateProfile implements IUpdateProfile {
  private readonly gateway: IProfileGateway;

  constructor(gateway: IProfileGateway) {
    this.gateway = gateway;
  }

  async execute(input: UpdateProfileInput): Promise<CustomerSchema> {
    try {
      return await this.gateway.updateProfile(input);
    } catch (error) {
      rethrowKnown(error);
    }
  }
}

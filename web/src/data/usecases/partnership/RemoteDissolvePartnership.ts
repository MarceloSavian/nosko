import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import type { IDissolvePartnership } from '@/domain/usecases/partnership/IDissolvePartnership';

export class RemoteDissolvePartnership implements IDissolvePartnership {
  private readonly gateway: IPartnershipGateway;

  constructor(gateway: IPartnershipGateway) {
    this.gateway = gateway;
  }

  async execute(): Promise<void> {
    try {
      await this.gateway.dissolvePartnership();
    } catch (error) {
      rethrowKnown(error);
    }
  }
}

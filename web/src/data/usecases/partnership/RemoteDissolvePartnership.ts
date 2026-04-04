import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import { PartnershipNotFoundError } from '@/domain/errors/partnership';
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
      if (error instanceof PartnershipNotFoundError) throw error;
      throw new UnexpectedError();
    }
  }
}

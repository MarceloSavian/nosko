import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import type { Partnership } from '@/domain/models/partnership/Partnership';
import type { ILoadPartnership } from '@/domain/usecases/partnership/ILoadPartnership';

export class RemoteLoadPartnership implements ILoadPartnership {
  private readonly gateway: IPartnershipGateway;

  constructor(gateway: IPartnershipGateway) {
    this.gateway = gateway;
  }

  async execute(): Promise<Partnership | null> {
    try {
      return await this.gateway.loadPartnership();
    } catch {
      throw new UnexpectedError();
    }
  }
}

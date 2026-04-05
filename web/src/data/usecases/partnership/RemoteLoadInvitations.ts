import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import type { PartnerInvitation } from '@/domain/models/partnership/Partnership';
import type { ILoadInvitations } from '@/domain/usecases/partnership/ILoadInvitations';

export class RemoteLoadInvitations implements ILoadInvitations {
  private readonly gateway: IPartnershipGateway;

  constructor(gateway: IPartnershipGateway) {
    this.gateway = gateway;
  }

  async execute(): Promise<PartnerInvitation[]> {
    try {
      return await this.gateway.loadInvitations();
    } catch (error) {
      rethrowKnown(error);
    }
  }
}

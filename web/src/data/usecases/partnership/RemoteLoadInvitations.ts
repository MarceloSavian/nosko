import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import { UnexpectedError } from '@/domain/errors/auth';
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
    } catch {
      throw new UnexpectedError();
    }
  }
}

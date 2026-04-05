import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import type { IDeclineInvitation } from '@/domain/usecases/partnership/IDeclineInvitation';

export class RemoteDeclineInvitation implements IDeclineInvitation {
  private readonly gateway: IPartnershipGateway;

  constructor(gateway: IPartnershipGateway) {
    this.gateway = gateway;
  }

  async execute(id: string): Promise<void> {
    try {
      await this.gateway.declineInvitation(id);
    } catch (error) {
      rethrowKnown(error);
    }
  }
}

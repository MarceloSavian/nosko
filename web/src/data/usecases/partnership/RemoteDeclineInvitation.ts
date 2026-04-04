import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import { InvitationNotFoundError } from '@/domain/errors/partnership';
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
      if (error instanceof InvitationNotFoundError) throw error;
      throw new UnexpectedError();
    }
  }
}

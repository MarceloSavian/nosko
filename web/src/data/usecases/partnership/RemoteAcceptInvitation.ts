import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import { InvitationNotFoundError } from '@/domain/errors/partnership';
import type { Partnership } from '@/domain/models/partnership/Partnership';
import type { IAcceptInvitation } from '@/domain/usecases/partnership/IAcceptInvitation';

export class RemoteAcceptInvitation implements IAcceptInvitation {
  private readonly gateway: IPartnershipGateway;

  constructor(gateway: IPartnershipGateway) {
    this.gateway = gateway;
  }

  async execute(id: string): Promise<Partnership> {
    try {
      return await this.gateway.acceptInvitation(id);
    } catch (error) {
      if (error instanceof InvitationNotFoundError) throw error;
      throw new UnexpectedError();
    }
  }
}

import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import { PartnershipAlreadyExistsError } from '@/domain/errors/partnership';
import type {
  InvitePartnerInput,
  PartnerInvitation,
} from '@/domain/models/partnership/Partnership';
import type { IInvitePartner } from '@/domain/usecases/partnership/IInvitePartner';

export class RemoteInvitePartner implements IInvitePartner {
  private readonly gateway: IPartnershipGateway;

  constructor(gateway: IPartnershipGateway) {
    this.gateway = gateway;
  }

  async execute(input: InvitePartnerInput): Promise<PartnerInvitation> {
    try {
      return await this.gateway.invitePartner(input);
    } catch (error) {
      if (error instanceof PartnershipAlreadyExistsError) throw error;
      throw new UnexpectedError();
    }
  }
}

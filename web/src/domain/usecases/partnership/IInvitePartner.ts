import type {
  InvitePartnerInput,
  PartnerInvitation,
} from '@/domain/models/partnership/Partnership';

export interface IInvitePartner {
  execute(input: InvitePartnerInput): Promise<PartnerInvitation>;
}

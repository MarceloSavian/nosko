import type {
  ContributionRuleSchema,
  InvitePartnerInput,
  PartnerInvitationSchema,
  PartnershipSchema,
  SetContributionRuleInput,
  SetSharedAccountsInput,
  SharedAccountSchema,
} from '../../models/partnership/Partnership.js';

export interface IPartnershipService {
  invitePartner(customerId: string, input: InvitePartnerInput): Promise<PartnerInvitationSchema>;
  listInvitations(customerId: string): Promise<PartnerInvitationSchema[]>;
  acceptInvitation(customerId: string, invitationId: string): Promise<PartnershipSchema>;
  declineInvitation(customerId: string, invitationId: string): Promise<void>;
  cancelInvitation(customerId: string, invitationId: string): Promise<void>;
  getPartnership(customerId: string): Promise<PartnershipSchema>;
  dissolvePartnership(customerId: string): Promise<void>;
  getContributionRules(customerId: string): Promise<ContributionRuleSchema | null>;
  setContributionRules(
    customerId: string,
    input: SetContributionRuleInput,
  ): Promise<ContributionRuleSchema>;
  getSharedAccounts(customerId: string): Promise<SharedAccountSchema[]>;
  setSharedAccounts(
    customerId: string,
    input: SetSharedAccountsInput,
  ): Promise<SharedAccountSchema[]>;
}

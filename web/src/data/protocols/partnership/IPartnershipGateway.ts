import type {
  BankAccount,
  ContributionRule,
  InvitePartnerInput,
  PartnerInvitation,
  Partnership,
  SetContributionRuleInput,
  SetSharedAccountsInput,
} from '@/domain/models/partnership/Partnership';

export interface IPartnershipGateway {
  invitePartner(input: InvitePartnerInput): Promise<PartnerInvitation>;
  loadInvitations(): Promise<PartnerInvitation[]>;
  acceptInvitation(id: string): Promise<Partnership>;
  declineInvitation(id: string): Promise<void>;
  cancelInvitation(id: string): Promise<void>;
  loadPartnership(): Promise<Partnership | null>;
  dissolvePartnership(): Promise<void>;
  loadContributionRules(): Promise<ContributionRule>;
  setContributionRules(input: SetContributionRuleInput): Promise<ContributionRule>;
  loadSharedAccounts(): Promise<BankAccount[]>;
  setSharedAccounts(input: SetSharedAccountsInput): Promise<BankAccount[]>;
  loadAccounts(): Promise<BankAccount[]>;
}

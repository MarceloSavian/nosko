import { z } from 'zod/v4';

export const InvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED',
} as const;

export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus];

export const ContributionType = {
  EQUAL: 'EQUAL',
  SALARY_PROPORTIONAL: 'SALARY_PROPORTIONAL',
  CUSTOM_PERCENTAGE: 'CUSTOM_PERCENTAGE',
} as const;

export type ContributionType = (typeof ContributionType)[keyof typeof ContributionType];

export const AccountType = {
  CHECKING: 'CHECKING',
  SAVINGS: 'SAVINGS',
  CREDIT: 'CREDIT',
  INVESTMENT: 'INVESTMENT',
} as const;

export type AccountType = (typeof AccountType)[keyof typeof AccountType];

const invitationStatusValues = Object.values(InvitationStatus) as [
  InvitationStatus,
  ...InvitationStatus[],
];

const contributionTypeValues = Object.values(ContributionType) as [
  ContributionType,
  ...ContributionType[],
];

const accountTypeValues = Object.values(AccountType) as [AccountType, ...AccountType[]];

export const partnerInvitationSchema = z.object({
  id: z.string(),
  inviterId: z.string(),
  inviteeEmail: z.string(),
  status: z.enum(invitationStatusValues),
  acceptedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type PartnerInvitation = z.infer<typeof partnerInvitationSchema>;

export const partnershipSchema = z.object({
  id: z.string(),
  invitationId: z.string(),
  customerAId: z.string(),
  customerBId: z.string(),
  createdAt: z.string(),
});

export type Partnership = z.infer<typeof partnershipSchema>;

export const contributionRuleSchema = z.object({
  id: z.string(),
  partnershipId: z.string(),
  type: z.enum(contributionTypeValues),
  customerAPercentage: z.number().int().nullable(),
  customerBPercentage: z.number().int().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ContributionRule = z.infer<typeof contributionRuleSchema>;

export const bankAccountSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  accountName: z.string(),
  currencyCode: z.string(),
  balance: z.number().int(),
  accountType: z.enum(accountTypeValues),
  balanceUpdatedAt: z.string(),
  createdAt: z.string(),
});

export type BankAccount = z.infer<typeof bankAccountSchema>;

export const invitePartnerInputSchema = z.object({
  email: z.email('Invalid email'),
});

export type InvitePartnerInput = z.infer<typeof invitePartnerInputSchema>;

export const setContributionRuleInputSchema = z.object({
  type: z.enum(contributionTypeValues),
  customerAPercentage: z.number().int().min(0).max(100).optional(),
  customerBPercentage: z.number().int().min(0).max(100).optional(),
});

export type SetContributionRuleInput = z.infer<typeof setContributionRuleInputSchema>;

export const setSharedAccountsInputSchema = z.object({
  bankAccountIds: z.array(z.string()),
});

export type SetSharedAccountsInput = z.infer<typeof setSharedAccountsInputSchema>;

import { z } from 'zod/v4';

export const InvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED',
} as const;

export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus];

const invitationStatusValues = Object.values(InvitationStatus) as [
  InvitationStatus,
  ...InvitationStatus[],
];

export const partnerInvitationSchema = z.object({
  id: z.string(),
  inviterId: z.string(),
  inviteeEmail: z.string(),
  status: z.enum(invitationStatusValues),
  acceptedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type PartnerInvitationSchema = z.infer<typeof partnerInvitationSchema>;

export const invitePartnerInputSchema = z.object({
  email: z.email('Invalid email'),
});

export type InvitePartnerInput = z.infer<typeof invitePartnerInputSchema>;

export const partnershipSchema = z.object({
  id: z.string(),
  invitationId: z.string(),
  customerAId: z.string(),
  customerBId: z.string(),
  createdAt: z.string(),
});

export type PartnershipSchema = z.infer<typeof partnershipSchema>;

export const ContributionType = {
  EQUAL: 'EQUAL',
  SALARY_PROPORTIONAL: 'SALARY_PROPORTIONAL',
  CUSTOM_PERCENTAGE: 'CUSTOM_PERCENTAGE',
} as const;

export type ContributionType = (typeof ContributionType)[keyof typeof ContributionType];

const contributionTypeValues = Object.values(ContributionType) as [
  ContributionType,
  ...ContributionType[],
];

export const contributionRuleSchema = z.object({
  id: z.string(),
  partnershipId: z.string(),
  type: z.enum(contributionTypeValues),
  customerAPercentage: z.number().int().nullable(),
  customerBPercentage: z.number().int().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ContributionRuleSchema = z.infer<typeof contributionRuleSchema>;

export const setContributionRuleInputSchema = z.object({
  type: z.enum(contributionTypeValues),
  customerAPercentage: z.number().int().min(0).max(10000).optional(),
  customerBPercentage: z.number().int().min(0).max(10000).optional(),
});

export type SetContributionRuleInput = z.infer<typeof setContributionRuleInputSchema>;

export const setSharedAccountsInputSchema = z.object({
  bankAccountIds: z.array(z.uuid()),
});

export type SetSharedAccountsInput = z.infer<typeof setSharedAccountsInputSchema>;

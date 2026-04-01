import { z } from 'zod';

// Partner Invitations
export const partnerInvitationSchema = z.object({
  id: z.string(),
  inviterId: z.string(),
  inviteeEmail: z.string(),
  status: z.string(),
  acceptedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type PartnerInvitationSchema = z.infer<typeof partnerInvitationSchema>;

export const InvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED',
} as const;

export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus];

export const invitePartnerInputSchema = z.object({
  email: z.string().email('Invalid email'),
});

export type InvitePartnerInput = z.infer<typeof invitePartnerInputSchema>;

// Partnerships
export const partnershipSchema = z.object({
  id: z.string(),
  invitationId: z.string(),
  customerAId: z.string(),
  customerBId: z.string(),
  createdAt: z.string(),
});

export type PartnershipSchema = z.infer<typeof partnershipSchema>;

// Contribution Rules
export const contributionRuleSchema = z.object({
  id: z.string(),
  partnershipId: z.string(),
  type: z.string(),
  customerAPercentage: z.string().nullable(),
  customerBPercentage: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ContributionRuleSchema = z.infer<typeof contributionRuleSchema>;

export const ContributionType = {
  EQUAL: 'EQUAL',
  SALARY_PROPORTIONAL: 'SALARY_PROPORTIONAL',
  CUSTOM_PERCENTAGE: 'CUSTOM_PERCENTAGE',
} as const;

export type ContributionType = (typeof ContributionType)[keyof typeof ContributionType];

export const setContributionRuleInputSchema = z.object({
  type: z.enum(['EQUAL', 'SALARY_PROPORTIONAL', 'CUSTOM_PERCENTAGE']),
  customerAPercentage: z.number().min(0).max(100).optional(),
  customerBPercentage: z.number().min(0).max(100).optional(),
});

export type SetContributionRuleInput = z.infer<typeof setContributionRuleInputSchema>;

// Shared Accounts
export const setSharedAccountsInputSchema = z.object({
  bankAccountIds: z.array(z.string().uuid()),
});

export type SetSharedAccountsInput = z.infer<typeof setSharedAccountsInputSchema>;

export const sharedAccountSchema = z.object({
  id: z.string(),
  partnershipId: z.string(),
  bankAccountId: z.string(),
  sharedByCustomerId: z.string(),
  createdAt: z.string(),
});

export type SharedAccountSchema = z.infer<typeof sharedAccountSchema>;

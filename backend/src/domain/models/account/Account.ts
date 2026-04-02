import { z } from 'zod/v4';

export const AccountType = {
  CHECKING: 'CHECKING',
  SAVINGS: 'SAVINGS',
  CREDIT: 'CREDIT',
  INVESTMENT: 'INVESTMENT',
} as const;

export type AccountType = (typeof AccountType)[keyof typeof AccountType];

const accountTypeValues = Object.values(AccountType) as [AccountType, ...AccountType[]];

export const bankAccountSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  accountName: z.string(),
  currencyCode: z.string(),
  balance: z.number().int(),
  accountType: z.enum(accountTypeValues),
  balanceUpdatedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type BankAccountSchema = z.infer<typeof bankAccountSchema>;

export const createBankAccountInputSchema = z.object({
  institutionId: z.uuid('Invalid institution ID'),
  accountName: z.string().min(1, 'Account name is required').max(100),
  currencyCode: z.string().length(3, 'Currency code must be 3 characters'),
  accountType: z.enum(accountTypeValues).optional().default(AccountType.CHECKING),
  balance: z.number().int().optional().default(0),
});

export type CreateBankAccountInput = z.infer<typeof createBankAccountInputSchema>;

export const updateBankAccountInputSchema = z.object({
  accountName: z.string().min(1).max(100).optional(),
  balance: z.number().int().optional(),
  accountType: z.enum(accountTypeValues).optional(),
});

export type UpdateBankAccountInput = z.infer<typeof updateBankAccountInputSchema>;

export const accountOverviewSchema = z.object({
  totalsByCurrency: z.array(
    z.object({
      currencyCode: z.string(),
      total: z.string(),
    }),
  ),
});

export type AccountOverviewSchema = z.infer<typeof accountOverviewSchema>;

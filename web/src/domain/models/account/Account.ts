import { z } from 'zod/v4';

export const AccountType = {
  CHECKING: 'CHECKING',
  SAVINGS: 'SAVINGS',
  CREDIT: 'CREDIT',
  INVESTMENT: 'INVESTMENT',
} as const;

export type AccountType = (typeof AccountType)[keyof typeof AccountType];

const accountTypeValues = Object.values(AccountType) as [AccountType, ...AccountType[]];

export const accountTypeSchema = z.enum(accountTypeValues);

export const bankAccountSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  accountName: z.string(),
  currencyCode: z.string(),
  balance: z.number().int(),
  accountType: accountTypeSchema,
  balanceUpdatedAt: z.string(),
  createdAt: z.string(),
});

export type BankAccount = z.infer<typeof bankAccountSchema>;

export const createBankAccountInputSchema = z.object({
  institutionId: z.string().min(1),
  accountName: z.string().min(1),
  currencyCode: z.string().min(1),
  accountType: accountTypeSchema.optional(),
  balance: z.number().int().optional(),
});

export type CreateBankAccountInput = z.infer<typeof createBankAccountInputSchema>;

export const updateBankAccountInputSchema = z.object({
  accountName: z.string().min(1).optional(),
  balance: z.number().int().optional(),
  accountType: accountTypeSchema.optional(),
});

export type UpdateBankAccountInput = z.infer<typeof updateBankAccountInputSchema>;

export const currencyTotalSchema = z.object({
  currencyCode: z.string(),
  total: z.number().int(),
});

export const accountOverviewSchema = z.object({
  totalsByCurrency: z.array(currencyTotalSchema),
});

export type AccountOverview = z.infer<typeof accountOverviewSchema>;
export type CurrencyTotal = z.infer<typeof currencyTotalSchema>;

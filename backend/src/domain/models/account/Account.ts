import { z } from 'zod';

export const bankAccountSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  institutionId: z.string(),
  accountName: z.string(),
  accountNumberLast4: z.string().nullable(),
  currencyCode: z.string(),
  balance: z.string(),
  accountType: z.string().nullable(),
  balanceUpdatedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type BankAccountSchema = z.infer<typeof bankAccountSchema>;

export const createBankAccountInputSchema = z.object({
  institutionId: z.string().uuid('Invalid institution ID'),
  accountName: z.string().min(1, 'Account name is required').max(100),
  accountNumberLast4: z.string().length(4).nullable().optional(),
  currencyCode: z.string().length(3, 'Currency code must be 3 characters'),
  accountType: z.string().max(20).nullable().optional(),
  balance: z.number().optional().default(0),
});

export type CreateBankAccountInput = z.infer<typeof createBankAccountInputSchema>;

export const updateBankAccountInputSchema = z.object({
  accountName: z.string().min(1).max(100).optional(),
  accountNumberLast4: z.string().length(4).nullable().optional(),
  balance: z.number().optional(),
  accountType: z.string().max(20).nullable().optional(),
});

export type UpdateBankAccountInput = z.infer<typeof updateBankAccountInputSchema>;

export const accountOverviewSchema = z.object({
  totalsByurrency: z.array(
    z.object({
      currencyCode: z.string(),
      total: z.string(),
    }),
  ),
});

export type AccountOverviewSchema = z.infer<typeof accountOverviewSchema>;

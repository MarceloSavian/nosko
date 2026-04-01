import { z } from 'zod';

export const transactionSchema = z.object({
  id: z.string(),
  bankAccountId: z.string(),
  categoryId: z.string().nullable(),
  budgetItemId: z.string().nullable(),
  amount: z.string(),
  description: z.string().nullable(),
  transactionDate: z.string(),
  createdAt: z.string(),
});

export type TransactionSchema = z.infer<typeof transactionSchema>;

export const createTransactionInputSchema = z.object({
  bankAccountId: z.string().uuid('Invalid bank account ID'),
  categoryId: z.string().uuid().nullable().optional(),
  budgetItemId: z.string().uuid().nullable().optional(),
  amount: z.number(),
  description: z.string().max(500).nullable().optional(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

export const updateTransactionInputSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  budgetItemId: z.string().uuid().nullable().optional(),
  amount: z.number().optional(),
  description: z.string().max(500).nullable().optional(),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionInputSchema>;

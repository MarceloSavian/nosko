import { z } from 'zod/v4';

export const transactionSchema = z.object({
  id: z.string(),
  bankAccountId: z.string(),
  categoryId: z.string().nullable(),
  budgetItemId: z.string().nullable(),
  amount: z.number().int(),
  description: z.string().nullable(),
  transactionDate: z.string(),
  createdAt: z.string(),
});

export type Transaction = z.infer<typeof transactionSchema>;

export const createTransactionInputSchema = z.object({
  bankAccountId: z.uuid(),
  categoryId: z.uuid().optional(),
  budgetItemId: z.uuid().optional(),
  amount: z.number().int(),
  description: z.string().max(500).optional(),
  transactionDate: z.string(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

export const updateTransactionInputSchema = z.object({
  categoryId: z.uuid().optional(),
  budgetItemId: z.uuid().optional(),
  amount: z.number().int().optional(),
  description: z.string().max(500).optional(),
  transactionDate: z.string().optional(),
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionInputSchema>;

export const paginatedTransactionsSchema = z.object({
  data: z.array(transactionSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

export type PaginatedTransactions = z.infer<typeof paginatedTransactionsSchema>;

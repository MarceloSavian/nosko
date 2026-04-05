import { z } from 'zod/v4';

export const budgetSummaryItemSchema = z.object({
  categoryName: z.string(),
  planned: z.number(),
  actual: z.number(),
});

export type BudgetSummaryItem = z.infer<typeof budgetSummaryItemSchema>;

export const recentTransactionSchema = z.object({
  id: z.string(),
  description: z.string().nullable(),
  amount: z.number(),
  transactionDate: z.string(),
});

export type RecentTransaction = z.infer<typeof recentTransactionSchema>;

export const dashboardDataSchema = z.object({
  yearMonth: z.string(),
  totalSpending: z.number(),
  budgetSummary: budgetSummaryItemSchema.array(),
  recentTransactions: recentTransactionSchema.array(),
});

export type DashboardData = z.infer<typeof dashboardDataSchema>;

import { z } from 'zod/v4';

export const BudgetItemDirection = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
} as const;

export type BudgetItemDirection = (typeof BudgetItemDirection)[keyof typeof BudgetItemDirection];

export const BudgetItemType = {
  FIXED: 'FIXED',
  ESTIMATED: 'ESTIMATED',
} as const;

export type BudgetItemType = (typeof BudgetItemType)[keyof typeof BudgetItemType];

export const BudgetItemRecurrence = {
  PERMANENT: 'PERMANENT',
  ONE_TIME: 'ONE_TIME',
  INSTALLMENT: 'INSTALLMENT',
} as const;

export type BudgetItemRecurrence = (typeof BudgetItemRecurrence)[keyof typeof BudgetItemRecurrence];

export const budgetPlanSchema = z.object({
  id: z.string(),
  customerId: z.string().nullable(),
  partnershipId: z.string().nullable(),
  yearMonth: z.string(),
  currencyCode: z.string(),
  isJoint: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type BudgetPlan = z.infer<typeof budgetPlanSchema>;

export const budgetItemSchema = z.object({
  id: z.string(),
  planId: z.string(),
  categoryId: z.string(),
  name: z.string(),
  plannedAmount: z.number(),
  direction: z.enum(['INCOME', 'EXPENSE']),
  type: z.enum(['FIXED', 'ESTIMATED']),
  recurrence: z.enum(['PERMANENT', 'ONE_TIME', 'INSTALLMENT']),
  installmentTotal: z.number().nullable(),
  installmentNumber: z.number().nullable(),
  sourceItemId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type BudgetItem = z.infer<typeof budgetItemSchema>;

export const budgetPlanWithItemsSchema = z.object({
  plan: budgetPlanSchema,
  items: z.array(budgetItemSchema),
});

export type BudgetPlanWithItems = z.infer<typeof budgetPlanWithItemsSchema>;

export const createBudgetPlanInputSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM format'),
  currencyCode: z.string().length(3, 'Must be a 3-letter currency code'),
});

export type CreateBudgetPlanInput = z.infer<typeof createBudgetPlanInputSchema>;

export const addBudgetItemInputSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Name is required').max(100),
  plannedAmount: z.number().int().positive('Amount must be positive'),
  direction: z.enum(['INCOME', 'EXPENSE']),
  type: z.enum(['FIXED', 'ESTIMATED']),
  recurrence: z.enum(['PERMANENT', 'ONE_TIME', 'INSTALLMENT']),
  installmentTotal: z.number().int().positive().optional(),
});

export type AddBudgetItemInput = z.infer<typeof addBudgetItemInputSchema>;

export const updateBudgetItemInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  plannedAmount: z.number().int().positive().optional(),
  categoryId: z.string().optional(),
});

export type UpdateBudgetItemInput = z.infer<typeof updateBudgetItemInputSchema>;

const budgetSummaryItemSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  categoryId: z.string(),
  direction: z.enum(['INCOME', 'EXPENSE']),
  type: z.enum(['FIXED', 'ESTIMATED']),
  plannedAmount: z.number(),
  actualAmount: z.number(),
});

export type BudgetSummaryItem = z.infer<typeof budgetSummaryItemSchema>;

export const budgetSummarySchema = z.object({
  yearMonth: z.string(),
  personalIncome: z.number(),
  personalExpenses: z.number(),
  jointExpenses: z.number(),
  yourJointShare: z.number(),
  freeAmount: z.number(),
  personalItems: z.array(budgetSummaryItemSchema),
  jointItems: z.array(budgetSummaryItemSchema),
});

export type BudgetSummary = z.infer<typeof budgetSummarySchema>;

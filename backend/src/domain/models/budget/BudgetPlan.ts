import { z } from 'zod';

// Budget Plan
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

export type BudgetPlanSchema = z.infer<typeof budgetPlanSchema>;

export const createBudgetPlanInputSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM format'),
  currencyCode: z.string().length(3, 'Currency code must be 3 characters'),
});

export type CreateBudgetPlanInput = z.infer<typeof createBudgetPlanInputSchema>;

// Budget Item
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

export const budgetItemSchema = z.object({
  id: z.string(),
  planId: z.string(),
  categoryId: z.string(),
  name: z.string(),
  plannedAmount: z.string(),
  type: z.string(),
  recurrence: z.string(),
  installmentTotal: z.number().nullable(),
  installmentNumber: z.number().nullable(),
  sourceItemId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type BudgetItemSchema = z.infer<typeof budgetItemSchema>;

export const createBudgetItemInputSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  name: z.string().min(1, 'Name is required').max(200),
  plannedAmount: z.number().positive('Amount must be positive'),
  type: z.enum(['FIXED', 'ESTIMATED']),
  recurrence: z.enum(['PERMANENT', 'ONE_TIME', 'INSTALLMENT']),
  installmentTotal: z.number().int().min(2).optional(),
});

export type CreateBudgetItemInput = z.infer<typeof createBudgetItemInputSchema>;

export const updateBudgetItemInputSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  plannedAmount: z.number().positive().optional(),
  categoryId: z.string().uuid().optional(),
});

export type UpdateBudgetItemInput = z.infer<typeof updateBudgetItemInputSchema>;

import { z } from 'zod/v4';

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

export const BudgetItemDirection = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
} as const;

export type BudgetItemDirection = (typeof BudgetItemDirection)[keyof typeof BudgetItemDirection];

const budgetItemDirectionValues = Object.values(BudgetItemDirection) as [
  BudgetItemDirection,
  ...BudgetItemDirection[],
];

export const BudgetItemType = {
  FIXED: 'FIXED',
  ESTIMATED: 'ESTIMATED',
} as const;

export type BudgetItemType = (typeof BudgetItemType)[keyof typeof BudgetItemType];

const budgetItemTypeValues = Object.values(BudgetItemType) as [BudgetItemType, ...BudgetItemType[]];

export const BudgetItemRecurrence = {
  PERMANENT: 'PERMANENT',
  ONE_TIME: 'ONE_TIME',
  INSTALLMENT: 'INSTALLMENT',
} as const;

export type BudgetItemRecurrence = (typeof BudgetItemRecurrence)[keyof typeof BudgetItemRecurrence];

const budgetItemRecurrenceValues = Object.values(BudgetItemRecurrence) as [
  BudgetItemRecurrence,
  ...BudgetItemRecurrence[],
];

export const budgetItemSchema = z.object({
  id: z.string(),
  planId: z.string(),
  categoryId: z.string(),
  name: z.string(),
  plannedAmount: z.number().int(),
  direction: z.enum(budgetItemDirectionValues),
  type: z.enum(budgetItemTypeValues),
  recurrence: z.enum(budgetItemRecurrenceValues),
  installmentTotal: z.number().nullable(),
  installmentNumber: z.number().nullable(),
  sourceItemId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type BudgetItemSchema = z.infer<typeof budgetItemSchema>;

export const createBudgetItemInputSchema = z.object({
  categoryId: z.uuid('Invalid category ID'),
  name: z.string().min(1, 'Name is required').max(200),
  plannedAmount: z.number().int().positive('Amount must be positive'),
  direction: z.enum(budgetItemDirectionValues),
  type: z.enum(budgetItemTypeValues),
  recurrence: z.enum(budgetItemRecurrenceValues),
  installmentTotal: z.number().int().min(2).optional(),
});

export type CreateBudgetItemInput = z.infer<typeof createBudgetItemInputSchema>;

export const updateBudgetItemInputSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  plannedAmount: z.number().positive().optional(),
  categoryId: z.uuid().optional(),
});

export type UpdateBudgetItemInput = z.infer<typeof updateBudgetItemInputSchema>;

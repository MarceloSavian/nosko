import { z } from 'zod/v4';

export const budgetCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  isSystem: z.boolean(),
  createdAt: z.string(),
});

export type BudgetCategory = z.infer<typeof budgetCategorySchema>;

export const createBudgetCategoryInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  icon: z.string().optional(),
});

export type CreateBudgetCategoryInput = z.infer<typeof createBudgetCategoryInputSchema>;

export const updateBudgetCategoryInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().optional(),
});

export type UpdateBudgetCategoryInput = z.infer<typeof updateBudgetCategoryInputSchema>;

import type {
  BudgetItemSchema,
  BudgetPlanSchema,
  CreateBudgetItemInput,
  CreateBudgetPlanInput,
  UpdateBudgetItemInput,
} from '../../models/budget/BudgetPlan.js';

export interface IBudgetPlanService {
  getPersonalPlan(
    customerId: string,
    yearMonth: string,
  ): Promise<{ plan: BudgetPlanSchema; items: BudgetItemSchema[] } | null>;
  createPersonalPlan(
    customerId: string,
    input: CreateBudgetPlanInput,
  ): Promise<{ plan: BudgetPlanSchema; items: BudgetItemSchema[] }>;
  deletePersonalPlan(customerId: string, planId: string): Promise<void>;
  getJointPlan(
    customerId: string,
    yearMonth: string,
  ): Promise<{ plan: BudgetPlanSchema; items: BudgetItemSchema[] } | null>;
  createJointPlan(
    customerId: string,
    input: CreateBudgetPlanInput,
  ): Promise<{ plan: BudgetPlanSchema; items: BudgetItemSchema[] }>;
  deleteJointPlan(customerId: string, planId: string): Promise<void>;
  addItem(
    customerId: string,
    planId: string,
    input: CreateBudgetItemInput,
  ): Promise<BudgetItemSchema>;
  updateItem(
    customerId: string,
    planId: string,
    itemId: string,
    input: UpdateBudgetItemInput,
  ): Promise<BudgetItemSchema>;
  deleteItem(customerId: string, planId: string, itemId: string): Promise<void>;
}

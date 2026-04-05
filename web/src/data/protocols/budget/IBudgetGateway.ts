import type {
  BudgetCategory,
  CreateBudgetCategoryInput,
  UpdateBudgetCategoryInput,
} from '@/domain/models/budget/BudgetCategory';
import type {
  AddBudgetItemInput,
  BudgetItem,
  BudgetPlanWithItems,
  BudgetSummary,
  CreateBudgetPlanInput,
  UpdateBudgetItemInput,
} from '@/domain/models/budget/BudgetPlan';

export interface IBudgetGateway {
  loadCategories(): Promise<BudgetCategory[]>;
  createCategory(input: CreateBudgetCategoryInput): Promise<BudgetCategory>;
  updateCategory(id: string, input: UpdateBudgetCategoryInput): Promise<BudgetCategory>;
  deleteCategory(id: string): Promise<void>;

  loadPlan(yearMonth: string): Promise<BudgetPlanWithItems | null>;
  createPlan(input: CreateBudgetPlanInput): Promise<BudgetPlanWithItems>;
  deletePlan(id: string): Promise<void>;

  loadJointPlan(yearMonth: string): Promise<BudgetPlanWithItems | null>;
  createJointPlan(input: CreateBudgetPlanInput): Promise<BudgetPlanWithItems>;
  deleteJointPlan(id: string): Promise<void>;

  addItem(planId: string, input: AddBudgetItemInput): Promise<BudgetItem>;
  updateItem(planId: string, itemId: string, input: UpdateBudgetItemInput): Promise<BudgetItem>;
  deleteItem(planId: string, itemId: string): Promise<void>;

  loadSummary(yearMonth: string): Promise<BudgetSummary>;
}

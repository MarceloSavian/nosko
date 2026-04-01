import { Pool } from 'pg';
import { BudgetCategoryService } from '../../data/services/budget/BudgetCategoryService.js';
import { BudgetPlanService } from '../../data/services/budget/BudgetPlanService.js';
import { BudgetCategoryRepository } from '../../infra/repositories/budget/BudgetCategoryRepository.js';
import { BudgetItemRepository } from '../../infra/repositories/budget/BudgetItemRepository.js';
import { BudgetPlanRepository } from '../../infra/repositories/budget/BudgetPlanRepository.js';
import { PartnershipRepository } from '../../infra/repositories/partnership/PartnershipRepository.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const budgetCategoryRepository = new BudgetCategoryRepository(pool);
const budgetPlanRepository = new BudgetPlanRepository(pool);
const budgetItemRepository = new BudgetItemRepository(pool);
const partnershipRepository = new PartnershipRepository(pool);

export const budgetCategoryService = new BudgetCategoryService(budgetCategoryRepository);
export const budgetPlanService = new BudgetPlanService(
  budgetPlanRepository,
  budgetItemRepository,
  partnershipRepository,
);

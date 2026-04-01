import { Pool } from 'pg';
import { BudgetCategoryService } from '../../data/services/budget/BudgetCategoryService.js';
import { BudgetCategoryRepository } from '../../infra/repositories/budget/BudgetCategoryRepository.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const budgetCategoryRepository = new BudgetCategoryRepository(pool);

export const budgetCategoryService = new BudgetCategoryService(budgetCategoryRepository);

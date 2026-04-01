import { Pool } from 'pg';
import { DashboardService } from '../../data/services/dashboard/DashboardService.js';
import { BankAccountRepository } from '../../infra/repositories/account/BankAccountRepository.js';
import { BudgetCategoryRepository } from '../../infra/repositories/budget/BudgetCategoryRepository.js';
import { BudgetItemRepository } from '../../infra/repositories/budget/BudgetItemRepository.js';
import { BudgetPlanRepository } from '../../infra/repositories/budget/BudgetPlanRepository.js';
import { TransactionRepository } from '../../infra/repositories/transaction/TransactionRepository.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const bankAccountRepository = new BankAccountRepository(pool);
const planRepository = new BudgetPlanRepository(pool);
const itemRepository = new BudgetItemRepository(pool);
const transactionRepository = new TransactionRepository(pool);
const categoryRepository = new BudgetCategoryRepository(pool);

export const dashboardService = new DashboardService(
  bankAccountRepository,
  planRepository,
  itemRepository,
  transactionRepository,
  categoryRepository,
);

import { jwtService } from '../factories/auth.js';
import { budgetCategoryService, budgetPlanService } from '../factories/budget.js';
import { makeBudgetHandler } from './budget-routes.js';

export const handler = makeBudgetHandler(budgetCategoryService, budgetPlanService, jwtService);

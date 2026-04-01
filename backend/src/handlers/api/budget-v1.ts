import { jwtService } from '../factories/auth.js';
import { budgetCategoryService } from '../factories/budget.js';
import { makeBudgetHandler } from './budget-routes.js';

export const handler = makeBudgetHandler(budgetCategoryService, jwtService);

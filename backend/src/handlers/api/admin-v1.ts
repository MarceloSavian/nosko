import {
  adminAuthService,
  adminBudgetCategoryService,
  adminCustomerService,
  adminInstitutionService,
  adminJwtService,
  adminManagementService,
  apiKey,
} from '../factories/admin.js';
import { makeAdminHandler } from './admin-routes.js';

export const handler = makeAdminHandler(
  apiKey,
  adminJwtService,
  adminAuthService,
  adminCustomerService,
  adminInstitutionService,
  adminBudgetCategoryService,
  adminManagementService,
);

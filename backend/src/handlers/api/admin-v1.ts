import {
  adminAuthService,
  adminBudgetCategoryService,
  adminCustomerService,
  adminInstitutionService,
  adminJwtService,
  adminManagementService,
  apiKey,
} from '../factories/admin.js';
import { cookieDomain } from '../factories/config.js';
import { makeAdminHandler } from './admin-routes.js';

export const handler = makeAdminHandler(
  apiKey,
  adminJwtService,
  cookieDomain,
  adminAuthService,
  adminCustomerService,
  adminInstitutionService,
  adminBudgetCategoryService,
  adminManagementService,
);

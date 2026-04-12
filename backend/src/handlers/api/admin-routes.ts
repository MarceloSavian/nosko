import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import type { IJwtService } from '../../data/domain/auth/IJwtService.js';
import {
  adminLoginInputSchema,
  adminRequestPasswordResetInputSchema,
  adminResetPasswordInputSchema,
  createAdminInputSchema,
} from '../../domain/models/admin/Admin.js';
import {
  createBudgetCategoryInputSchema,
  updateBudgetCategoryInputSchema,
} from '../../domain/models/budget/BudgetCategory.js';
import {
  createInstitutionInputSchema,
  updateInstitutionInputSchema,
} from '../../domain/models/institution/Institution.js';
import type { IAdminAuthService } from '../../domain/usecases/admin/IAdminAuthService.js';
import type { IAdminBudgetCategoryService } from '../../domain/usecases/admin/IAdminBudgetCategoryService.js';
import type { IAdminCustomerService } from '../../domain/usecases/admin/IAdminCustomerService.js';
import type { IAdminInstitutionService } from '../../domain/usecases/admin/IAdminInstitutionService.js';
import type { IAdminManagementService } from '../../domain/usecases/admin/IAdminManagementService.js';
import type { ProxyRoute } from '../domain/proxy.js';
import { withAdminAuth } from '../shared/admin-auth.js';
import { withApiKey } from '../shared/api-key.js';
import { ADMIN_COOKIE_NAME, clearAuthCookie, makeAuthCookie } from '../shared/cookie.js';
import { logErrorAndFormat } from '../shared/error.js';
import { formatResponse } from '../shared/response.js';

function makeAdminLoginRoute(service: IAdminAuthService, cookieDomain: string) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = adminLoginInputSchema.parse(body);
      const { accessToken, profile } = await service.login(input);
      return formatResponse(200, profile, {
        'Set-Cookie': makeAuthCookie(accessToken, ADMIN_COOKIE_NAME, cookieDomain),
      });
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

function makeAdminLogoutRoute(cookieDomain: string) {
  return async (_event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
    return formatResponse(200, { message: 'Logged out' }, {
      'Set-Cookie': clearAuthCookie(ADMIN_COOKIE_NAME, cookieDomain),
    });
  };
}

function makeAdminMeRoute(service: IAdminManagementService) {
  return async (
    _event: APIGatewayProxyEventV2,
    adminId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      return formatResponse(200, await service.getAdmin(adminId));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

function makeAdminRequestPasswordResetRoute(service: IAdminAuthService) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = adminRequestPasswordResetInputSchema.parse(body);
      await service.requestPasswordReset(input);
      return formatResponse(200, { message: 'If the email exists, a reset code was sent' });
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

function makeAdminResetPasswordRoute(service: IAdminAuthService) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = adminResetPasswordInputSchema.parse(body);
      await service.resetPassword(input);
      return formatResponse(200, { message: 'Password reset successfully' });
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

function makeListCustomersRoute(service: IAdminCustomerService) {
  return async (
    event: APIGatewayProxyEventV2,
    _adminId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const limit = Math.min(Number(event.queryStringParameters?.limit ?? 50), 100);
      const offset = Number(event.queryStringParameters?.offset ?? 0);
      return formatResponse(200, await service.listCustomers(limit, offset));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

function makeGetCustomerRoute(service: IAdminCustomerService) {
  return async (
    event: APIGatewayProxyEventV2,
    _adminId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const id = event.pathParameters?.id ?? '';
      return formatResponse(200, await service.getCustomer(id));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

function makeDeleteCustomerRoute(service: IAdminCustomerService) {
  return async (
    event: APIGatewayProxyEventV2,
    _adminId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const id = event.pathParameters?.id ?? '';
      await service.deleteCustomer(id);
      return formatResponse(204, {});
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

function makeListInstitutionsRoute(service: IAdminInstitutionService) {
  return async (
    _event: APIGatewayProxyEventV2,
    _adminId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      return formatResponse(200, await service.listInstitutions());
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

function makeCreateInstitutionRoute(service: IAdminInstitutionService) {
  return async (
    event: APIGatewayProxyEventV2,
    _adminId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = createInstitutionInputSchema.parse(body);
      return formatResponse(201, await service.createInstitution(input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

function makeUpdateInstitutionRoute(service: IAdminInstitutionService) {
  return async (
    event: APIGatewayProxyEventV2,
    _adminId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const id = event.pathParameters?.id ?? '';
      const body = JSON.parse(event.body ?? '{}');
      const input = updateInstitutionInputSchema.parse(body);
      return formatResponse(200, await service.updateInstitution(id, input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

function makeDeleteInstitutionRoute(service: IAdminInstitutionService) {
  return async (
    event: APIGatewayProxyEventV2,
    _adminId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const id = event.pathParameters?.id ?? '';
      await service.deleteInstitution(id);
      return formatResponse(204, {});
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

function makeListCategoriesRoute(service: IAdminBudgetCategoryService) {
  return async (
    _event: APIGatewayProxyEventV2,
    _adminId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      return formatResponse(200, await service.listCategories());
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

function makeCreateSystemCategoryRoute(service: IAdminBudgetCategoryService) {
  return async (
    event: APIGatewayProxyEventV2,
    _adminId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = createBudgetCategoryInputSchema.parse(body);
      return formatResponse(201, await service.createSystemCategory(input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

function makeUpdateCategoryRoute(service: IAdminBudgetCategoryService) {
  return async (
    event: APIGatewayProxyEventV2,
    _adminId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const id = event.pathParameters?.id ?? '';
      const body = JSON.parse(event.body ?? '{}');
      const input = updateBudgetCategoryInputSchema.parse(body);
      return formatResponse(200, await service.updateCategory(id, input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

function makeDeleteCategoryRoute(service: IAdminBudgetCategoryService) {
  return async (
    event: APIGatewayProxyEventV2,
    _adminId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const id = event.pathParameters?.id ?? '';
      await service.deleteCategory(id);
      return formatResponse(204, {});
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

function makeListAdminsRoute(service: IAdminManagementService) {
  return async (
    _event: APIGatewayProxyEventV2,
    _adminId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      return formatResponse(200, await service.listAdmins());
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

function makeCreateAdminRoute(service: IAdminManagementService) {
  return async (
    event: APIGatewayProxyEventV2,
    _adminId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = createAdminInputSchema.parse(body);
      return formatResponse(201, await service.createAdmin(input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

function makeDeleteAdminRoute(service: IAdminManagementService) {
  return async (
    event: APIGatewayProxyEventV2,
    _adminId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const id = event.pathParameters?.id ?? '';
      await service.deleteAdmin(id);
      return formatResponse(204, {});
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeAdminHandler(
  apiKey: string,
  jwtService: IJwtService,
  cookieDomain: string,
  authService: IAdminAuthService,
  customerService: IAdminCustomerService,
  institutionService: IAdminInstitutionService,
  budgetCategoryService: IAdminBudgetCategoryService,
  managementService: IAdminManagementService,
) {
  const auth = (handler: Parameters<typeof withAdminAuth>[2]) =>
    withAdminAuth(apiKey, jwtService, handler);

  const routes: ProxyRoute = {
    'POST /v1/admin/login': withApiKey(apiKey, makeAdminLoginRoute(authService, cookieDomain)),
    'POST /v1/admin/logout': withApiKey(apiKey, makeAdminLogoutRoute(cookieDomain)),
    'POST /v1/admin/request-password-reset': withApiKey(
      apiKey,
      makeAdminRequestPasswordResetRoute(authService),
    ),
    'POST /v1/admin/reset-password': withApiKey(apiKey, makeAdminResetPasswordRoute(authService)),

    'GET /v1/admin/me': auth(makeAdminMeRoute(managementService)),

    'GET /v1/admin/customers': auth(makeListCustomersRoute(customerService)),
    'GET /v1/admin/customers/{id}': auth(makeGetCustomerRoute(customerService)),
    'DELETE /v1/admin/customers/{id}': auth(makeDeleteCustomerRoute(customerService)),

    'GET /v1/admin/institutions': auth(makeListInstitutionsRoute(institutionService)),
    'POST /v1/admin/institutions': auth(makeCreateInstitutionRoute(institutionService)),
    'PUT /v1/admin/institutions/{id}': auth(makeUpdateInstitutionRoute(institutionService)),
    'DELETE /v1/admin/institutions/{id}': auth(makeDeleteInstitutionRoute(institutionService)),

    'GET /v1/admin/budget-categories': auth(makeListCategoriesRoute(budgetCategoryService)),
    'POST /v1/admin/budget-categories': auth(makeCreateSystemCategoryRoute(budgetCategoryService)),
    'PUT /v1/admin/budget-categories/{id}': auth(makeUpdateCategoryRoute(budgetCategoryService)),
    'DELETE /v1/admin/budget-categories/{id}': auth(makeDeleteCategoryRoute(budgetCategoryService)),

    'GET /v1/admin/admins': auth(makeListAdminsRoute(managementService)),
    'POST /v1/admin/admins': auth(makeCreateAdminRoute(managementService)),
    'DELETE /v1/admin/admins/{id}': auth(makeDeleteAdminRoute(managementService)),
  };

  return (event: APIGatewayProxyEventV2) => {
    const route = routes[event.routeKey];
    return route
      ? route(event)
      : Promise.resolve({ statusCode: 404, body: `Request path ${event.routeKey} not found` });
  };
}

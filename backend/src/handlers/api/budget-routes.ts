import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import type { IJwtService } from '../../data/domain/auth/IJwtService.js';
import {
  createBudgetCategoryInputSchema,
  updateBudgetCategoryInputSchema,
} from '../../domain/models/budget/BudgetCategory.js';
import {
  createBudgetItemInputSchema,
  createBudgetPlanInputSchema,
  updateBudgetItemInputSchema,
} from '../../domain/models/budget/BudgetPlan.js';
import type { IBudgetCategoryService } from '../../domain/usecases/budget/IBudgetCategoryService.js';
import type { IBudgetPlanService } from '../../domain/usecases/budget/IBudgetPlanService.js';
import type { ProxyRoute } from '../domain/proxy.js';
import { withAuth } from '../shared/auth.js';
import { logErrorAndFormat } from '../shared/error.js';
import { formatResponse } from '../shared/response.js';

function extractPathParam(event: APIGatewayProxyEventV2, name: string): string {
  return event.pathParameters?.[name] ?? '';
}

function extractQueryParam(event: APIGatewayProxyEventV2, name: string): string {
  return event.queryStringParameters?.[name] ?? '';
}

// Category routes

export function makeListCategoriesRoute(service: IBudgetCategoryService) {
  return async (
    _event: APIGatewayProxyEventV2,
    _customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      return formatResponse(200, await service.listCategories());
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeCreateCategoryRoute(service: IBudgetCategoryService) {
  return async (
    event: APIGatewayProxyEventV2,
    _customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = createBudgetCategoryInputSchema.parse(body);
      return formatResponse(201, await service.createCategory(input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeUpdateCategoryRoute(service: IBudgetCategoryService) {
  return async (
    event: APIGatewayProxyEventV2,
    _customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const id = extractPathParam(event, 'id');
      const body = JSON.parse(event.body ?? '{}');
      const input = updateBudgetCategoryInputSchema.parse(body);
      return formatResponse(200, await service.updateCategory(id, input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeDeleteCategoryRoute(service: IBudgetCategoryService) {
  return async (
    event: APIGatewayProxyEventV2,
    _customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const id = extractPathParam(event, 'id');
      await service.deleteCategory(id);
      return formatResponse(204, {});
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

// Plan routes

export function makeGetPersonalPlanRoute(service: IBudgetPlanService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const yearMonth = extractQueryParam(event, 'yearMonth');
      const result = await service.getPersonalPlan(customerId, yearMonth);
      return formatResponse(200, result ?? { plan: null, items: [] });
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeCreatePersonalPlanRoute(service: IBudgetPlanService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = createBudgetPlanInputSchema.parse(body);
      return formatResponse(201, await service.createPersonalPlan(customerId, input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeDeletePersonalPlanRoute(service: IBudgetPlanService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const planId = extractPathParam(event, 'id');
      await service.deletePersonalPlan(customerId, planId);
      return formatResponse(204, {});
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeGetJointPlanRoute(service: IBudgetPlanService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const yearMonth = extractQueryParam(event, 'yearMonth');
      const result = await service.getJointPlan(customerId, yearMonth);
      return formatResponse(200, result ?? { plan: null, items: [] });
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeCreateJointPlanRoute(service: IBudgetPlanService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = createBudgetPlanInputSchema.parse(body);
      return formatResponse(201, await service.createJointPlan(customerId, input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeDeleteJointPlanRoute(service: IBudgetPlanService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const planId = extractPathParam(event, 'id');
      await service.deleteJointPlan(customerId, planId);
      return formatResponse(204, {});
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

// Item routes

export function makeAddItemRoute(service: IBudgetPlanService) {
  return async (
    event: APIGatewayProxyEventV2,
    _customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const planId = extractPathParam(event, 'planId');
      const body = JSON.parse(event.body ?? '{}');
      const input = createBudgetItemInputSchema.parse(body);
      return formatResponse(201, await service.addItem(planId, input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeUpdateItemRoute(service: IBudgetPlanService) {
  return async (
    event: APIGatewayProxyEventV2,
    _customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const planId = extractPathParam(event, 'planId');
      const itemId = extractPathParam(event, 'id');
      const body = JSON.parse(event.body ?? '{}');
      const input = updateBudgetItemInputSchema.parse(body);
      return formatResponse(200, await service.updateItem(planId, itemId, input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeDeleteItemRoute(service: IBudgetPlanService) {
  return async (
    event: APIGatewayProxyEventV2,
    _customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const planId = extractPathParam(event, 'planId');
      const itemId = extractPathParam(event, 'id');
      await service.deleteItem(planId, itemId);
      return formatResponse(204, {});
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeBudgetHandler(
  categoryService: IBudgetCategoryService,
  planService: IBudgetPlanService,
  jwtService: IJwtService,
) {
  const routes: ProxyRoute = {
    // Categories
    'GET /budget-categories': withAuth(jwtService, makeListCategoriesRoute(categoryService)),
    'POST /budget-categories': withAuth(jwtService, makeCreateCategoryRoute(categoryService)),
    'PUT /budget-categories/{id}': withAuth(jwtService, makeUpdateCategoryRoute(categoryService)),
    'DELETE /budget-categories/{id}': withAuth(
      jwtService,
      makeDeleteCategoryRoute(categoryService),
    ),
    // Personal plans
    'GET /budget-plans': withAuth(jwtService, makeGetPersonalPlanRoute(planService)),
    'POST /budget-plans': withAuth(jwtService, makeCreatePersonalPlanRoute(planService)),
    'DELETE /budget-plans/{id}': withAuth(jwtService, makeDeletePersonalPlanRoute(planService)),
    // Joint plans
    'GET /partnership/budget-plans': withAuth(jwtService, makeGetJointPlanRoute(planService)),
    'POST /partnership/budget-plans': withAuth(jwtService, makeCreateJointPlanRoute(planService)),
    'DELETE /partnership/budget-plans/{id}': withAuth(
      jwtService,
      makeDeleteJointPlanRoute(planService),
    ),
    // Items
    'POST /budget-plans/{planId}/items': withAuth(jwtService, makeAddItemRoute(planService)),
    'PUT /budget-plans/{planId}/items/{id}': withAuth(jwtService, makeUpdateItemRoute(planService)),
    'DELETE /budget-plans/{planId}/items/{id}': withAuth(
      jwtService,
      makeDeleteItemRoute(planService),
    ),
  };
  return (event: APIGatewayProxyEventV2) => {
    const route = routes[event.routeKey];
    return route
      ? route(event)
      : Promise.resolve({ statusCode: 404, body: `Request path ${event.routeKey} not found` });
  };
}

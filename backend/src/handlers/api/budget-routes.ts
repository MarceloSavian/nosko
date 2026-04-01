import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import type { IJwtService } from '../../data/domain/auth/IJwtService.js';
import {
  createBudgetCategoryInputSchema,
  updateBudgetCategoryInputSchema,
} from '../../domain/models/budget/BudgetCategory.js';
import type { IBudgetCategoryService } from '../../domain/usecases/budget/IBudgetCategoryService.js';
import type { ProxyRoute } from '../domain/proxy.js';
import { withAuth } from '../shared/auth.js';
import { logErrorAndFormat } from '../shared/error.js';
import { formatResponse } from '../shared/response.js';

function extractPathParam(event: APIGatewayProxyEventV2, name: string): string {
  return event.pathParameters?.[name] ?? '';
}

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

export function makeBudgetHandler(
  categoryService: IBudgetCategoryService,
  jwtService: IJwtService,
) {
  const routes: ProxyRoute = {
    'GET /budget-categories': withAuth(jwtService, makeListCategoriesRoute(categoryService)),
    'POST /budget-categories': withAuth(jwtService, makeCreateCategoryRoute(categoryService)),
    'PUT /budget-categories/{id}': withAuth(jwtService, makeUpdateCategoryRoute(categoryService)),
    'DELETE /budget-categories/{id}': withAuth(
      jwtService,
      makeDeleteCategoryRoute(categoryService),
    ),
  };
  return (event: APIGatewayProxyEventV2) => {
    const route = routes[event.routeKey];
    return route
      ? route(event)
      : Promise.resolve({ statusCode: 404, body: `Request path ${event.routeKey} not found` });
  };
}

import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import type { IJwtService } from '../../data/domain/auth/IJwtService.js';
import {
  createBankAccountInputSchema,
  updateBankAccountInputSchema,
} from '../../domain/models/account/Account.js';
import type { IAccountService } from '../../domain/usecases/account/IAccountService.js';
import type { ProxyRoute } from '../domain/proxy.js';
import { withAuth } from '../shared/auth.js';
import { logErrorAndFormat } from '../shared/error.js';
import { formatResponse } from '../shared/response.js';

function extractPathParam(event: APIGatewayProxyEventV2, name: string): string {
  return event.pathParameters?.[name] ?? '';
}

export function makeListAccountsRoute(service: IAccountService) {
  return async (
    _event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      return formatResponse(200, await service.listAccounts(customerId));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeGetAccountRoute(service: IAccountService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const accountId = extractPathParam(event, 'id');
      return formatResponse(200, await service.getAccount(customerId, accountId));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeCreateAccountRoute(service: IAccountService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = createBankAccountInputSchema.parse(body);
      return formatResponse(201, await service.createAccount(customerId, input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeUpdateAccountRoute(service: IAccountService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const accountId = extractPathParam(event, 'id');
      const body = JSON.parse(event.body ?? '{}');
      const input = updateBankAccountInputSchema.parse(body);
      return formatResponse(200, await service.updateAccount(customerId, accountId, input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeDeleteAccountRoute(service: IAccountService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const accountId = extractPathParam(event, 'id');
      await service.deleteAccount(customerId, accountId);
      return formatResponse(204, {});
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeGetOverviewRoute(service: IAccountService) {
  return async (
    _event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      return formatResponse(200, await service.getOverview(customerId));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeAccountHandler(service: IAccountService, jwtService: IJwtService) {
  const routes: ProxyRoute = {
    'GET /accounts': withAuth(jwtService, makeListAccountsRoute(service)),
    'POST /accounts': withAuth(jwtService, makeCreateAccountRoute(service)),
    'GET /accounts/overview': withAuth(jwtService, makeGetOverviewRoute(service)),
    'GET /accounts/{id}': withAuth(jwtService, makeGetAccountRoute(service)),
    'PUT /accounts/{id}': withAuth(jwtService, makeUpdateAccountRoute(service)),
    'DELETE /accounts/{id}': withAuth(jwtService, makeDeleteAccountRoute(service)),
  };
  return (event: APIGatewayProxyEventV2) => {
    const route = routes[event.routeKey];
    return route
      ? route(event)
      : Promise.resolve({ statusCode: 404, body: `Request path ${event.routeKey} not found` });
  };
}

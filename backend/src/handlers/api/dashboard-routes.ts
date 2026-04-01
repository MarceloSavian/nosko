import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import type { IJwtService } from '../../data/domain/auth/IJwtService.js';
import type { IDashboardService } from '../../domain/usecases/dashboard/IDashboardService.js';
import type { ProxyRoute } from '../domain/proxy.js';
import { withAuth } from '../shared/auth.js';
import { logErrorAndFormat } from '../shared/error.js';
import { formatResponse } from '../shared/response.js';

export function makeGetDashboardRoute(service: IDashboardService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const yearMonth = event.queryStringParameters?.yearMonth ?? '';
      return formatResponse(200, await service.getDashboard(customerId, yearMonth));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeDashboardHandler(service: IDashboardService, jwtService: IJwtService) {
  const routes: ProxyRoute = {
    'GET /v1/dashboard': withAuth(jwtService, makeGetDashboardRoute(service)),
  };
  return (event: APIGatewayProxyEventV2) => {
    const route = routes[event.routeKey];
    return route
      ? route(event)
      : Promise.resolve({ statusCode: 404, body: `Request path ${event.routeKey} not found` });
  };
}

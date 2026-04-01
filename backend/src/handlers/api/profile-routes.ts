import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import type { IJwtService } from '../../data/domain/auth/IJwtService.js';
import type { IProfileService } from '../../domain/usecases/profile/IProfileService.js';
import type { ProxyRoute } from '../domain/proxy.js';
import { logErrorAndFormat } from '../shared/error.js';
import { formatResponse } from '../shared/response.js';
import { withAuth } from '../shared/auth.js';

export function makeGetProfileRoute(service: IProfileService) {
  return async (_event: APIGatewayProxyEventV2, customerId: string): Promise<APIGatewayProxyResult> => {
    try {
      return formatResponse(200, await service.getProfile(customerId));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeProfileHandler(service: IProfileService, jwtService: IJwtService) {
  const routes: ProxyRoute = {
    'GET /me': withAuth(jwtService, makeGetProfileRoute(service)),
  };
  return (event: APIGatewayProxyEventV2) => {
    const route = routes[event.routeKey];
    return route
      ? route(event)
      : Promise.resolve({ statusCode: 404, body: `Request path ${event.routeKey} not found` });
  };
}

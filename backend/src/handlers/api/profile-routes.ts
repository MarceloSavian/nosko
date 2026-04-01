import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import type { IJwtService } from '../../data/domain/auth/IJwtService.js';
import { updateProfileInputSchema } from '../../domain/models/customer/Customer.js';
import type { IProfileService } from '../../domain/usecases/profile/IProfileService.js';
import type { ProxyRoute } from '../domain/proxy.js';
import { withAuth } from '../shared/auth.js';
import { logErrorAndFormat } from '../shared/error.js';
import { formatResponse } from '../shared/response.js';

export function makeGetProfileRoute(service: IProfileService) {
  return async (
    _event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      return formatResponse(200, await service.getProfile(customerId));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeUpdateProfileRoute(service: IProfileService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = updateProfileInputSchema.parse(body);
      return formatResponse(200, await service.updateProfile(customerId, input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeDeleteAccountRoute(service: IProfileService) {
  return async (
    _event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      await service.deleteAccount(customerId);
      return formatResponse(204, {});
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeProfileHandler(service: IProfileService, jwtService: IJwtService) {
  const routes: ProxyRoute = {
    'GET /me': withAuth(jwtService, makeGetProfileRoute(service)),
    'PUT /me': withAuth(jwtService, makeUpdateProfileRoute(service)),
    'DELETE /me': withAuth(jwtService, makeDeleteAccountRoute(service)),
  };
  return (event: APIGatewayProxyEventV2) => {
    const route = routes[event.routeKey];
    return route
      ? route(event)
      : Promise.resolve({ statusCode: 404, body: `Request path ${event.routeKey} not found` });
  };
}

import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import type { IJwtService } from '../../data/domain/auth/IJwtService.js';
import type { IInstitutionService } from '../../domain/usecases/institution/IInstitutionService.js';
import type { ProxyRoute } from '../domain/proxy.js';
import { withAuth } from '../shared/auth.js';
import { logErrorAndFormat } from '../shared/error.js';
import { formatResponse } from '../shared/response.js';

export function makeListInstitutionsRoute(service: IInstitutionService) {
  return async (
    _event: APIGatewayProxyEventV2,
    _customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      return formatResponse(200, await service.listInstitutions());
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeInstitutionHandler(service: IInstitutionService, jwtService: IJwtService) {
  const routes: ProxyRoute = {
    'GET /v1/institutions': withAuth(jwtService, makeListInstitutionsRoute(service)),
  };
  return (event: APIGatewayProxyEventV2) => {
    const route = routes[event.routeKey];
    return route
      ? route(event)
      : Promise.resolve({ statusCode: 404, body: `Request path ${event.routeKey} not found` });
  };
}

// Lambda handler
let _handler: ((event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResult>) | undefined;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
  if (!_handler) {
    const { jwtService } = await import('../factories/auth.js');
    const { institutionService } = await import('../factories/institution.js');
    _handler = makeInstitutionHandler(institutionService, jwtService);
  }
  return _handler(event);
};

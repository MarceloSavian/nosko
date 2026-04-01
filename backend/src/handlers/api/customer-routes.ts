import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import type { ICustomerService } from '../../domain/usecases/customer/ICustomerService.js';
import { signupInputSchema, loginInputSchema, verifyEmailInputSchema } from '../../domain/models/customer/Customer.js';
import type { ProxyRoute } from '../domain/proxy.js';
import { logErrorAndFormat } from '../shared/error.js';
import { formatResponse } from '../shared/response.js';

export function makeSignupRoute(service: ICustomerService) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = signupInputSchema.parse(body);
      return formatResponse(201, await service.signup(input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeLoginRoute(service: ICustomerService) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = loginInputSchema.parse(body);
      return formatResponse(200, await service.login(input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeVerifyEmailRoute(service: ICustomerService) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = verifyEmailInputSchema.parse(body);
      return formatResponse(200, await service.verifyEmail(input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export async function routeHandler(
  routes: ProxyRoute,
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> {
  const route = routes[event.routeKey];
  return route
    ? await route(event)
    : { statusCode: 404, body: `Request path ${event.routeKey} not found` };
}

export function makeCustomerHandler(service: ICustomerService) {
  const routes: ProxyRoute = {
    'POST /signup': makeSignupRoute(service),
    'POST /login': makeLoginRoute(service),
    'POST /verify-email': makeVerifyEmailRoute(service),
  };
  return (event: APIGatewayProxyEventV2) => routeHandler(routes, event);
}

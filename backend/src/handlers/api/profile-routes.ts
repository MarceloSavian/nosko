import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import type { IJwtService } from '../../data/domain/auth/IJwtService.js';
import { setCurrencyDefaultsInputSchema } from '../../domain/models/currency/Currency.js';
import { updateProfileInputSchema } from '../../domain/models/customer/Customer.js';
import type { ICurrencyService } from '../../domain/usecases/currency/ICurrencyService.js';
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

export function makeGetCurrenciesRoute(service: ICurrencyService) {
  return async (
    _event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      return formatResponse(200, await service.getCurrencyDefaults(customerId));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeSetCurrenciesRoute(service: ICurrencyService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = setCurrencyDefaultsInputSchema.parse(body);
      return formatResponse(200, await service.setCurrencyDefaults(customerId, input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeProfileHandler(
  service: IProfileService,
  currencyService: ICurrencyService,
  jwtService: IJwtService,
) {
  const routes: ProxyRoute = {
    'GET /v1/me': withAuth(jwtService, makeGetProfileRoute(service)),
    'PUT /v1/me': withAuth(jwtService, makeUpdateProfileRoute(service)),
    'DELETE /v1/me': withAuth(jwtService, makeDeleteAccountRoute(service)),
    'GET /v1/me/currencies': withAuth(jwtService, makeGetCurrenciesRoute(currencyService)),
    'PUT /v1/me/currencies': withAuth(jwtService, makeSetCurrenciesRoute(currencyService)),
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
    const { currencyService, profileService } = await import('../factories/profile.js');
    const { jwtService } = await import('../factories/auth.js');
    _handler = makeProfileHandler(profileService, currencyService, jwtService);
  }
  return _handler(event);
};

import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import {
  loginInputSchema,
  requestPasswordResetInputSchema,
  resendVerificationInputSchema,
  resetPasswordInputSchema,
  signupInputSchema,
  verifyEmailInputSchema,
} from '../../domain/models/customer/Customer.js';
import type { ICustomerService } from '../../domain/usecases/customer/ICustomerService.js';
import type { ProxyRoute } from '../domain/proxy.js';
import { CUSTOMER_COOKIE_NAME, clearAuthCookie, makeAuthCookie } from '../shared/cookie.js';
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

export function makeLoginRoute(service: ICustomerService, cookieDomain: string) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = loginInputSchema.parse(body);
      const { accessToken, profile } = await service.login(input);
      return formatResponse(200, profile, {
        'Set-Cookie': makeAuthCookie(accessToken, CUSTOMER_COOKIE_NAME, cookieDomain),
      });
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

export function makeResendVerificationRoute(service: ICustomerService) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = resendVerificationInputSchema.parse(body);
      await service.resendVerification(input);
      return formatResponse(200, { message: 'Verification code sent' });
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeRequestPasswordResetRoute(service: ICustomerService) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = requestPasswordResetInputSchema.parse(body);
      await service.requestPasswordReset(input);
      return formatResponse(200, { message: 'If the email exists, a reset code was sent' });
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeResetPasswordRoute(service: ICustomerService) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = resetPasswordInputSchema.parse(body);
      await service.resetPassword(input);
      return formatResponse(200, { message: 'Password reset successfully' });
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeLogoutRoute(cookieDomain: string) {
  return async (_event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
    return formatResponse(200, { message: 'Logged out' }, {
      'Set-Cookie': clearAuthCookie(CUSTOMER_COOKIE_NAME, cookieDomain),
    });
  };
}

export function makeCustomerHandler(service: ICustomerService, cookieDomain: string) {
  const routes: ProxyRoute = {
    'POST /v1/signup': makeSignupRoute(service),
    'POST /v1/login': makeLoginRoute(service, cookieDomain),
    'POST /v1/verify-email': makeVerifyEmailRoute(service),
    'POST /v1/resend-verification': makeResendVerificationRoute(service),
    'POST /v1/request-password-reset': makeRequestPasswordResetRoute(service),
    'POST /v1/reset-password': makeResetPasswordRoute(service),
    'POST /v1/logout': makeLogoutRoute(cookieDomain),
  };
  return (event: APIGatewayProxyEventV2) => routeHandler(routes, event);
}

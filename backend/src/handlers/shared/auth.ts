import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import type { IJwtService } from '../../data/domain/auth/IJwtService.js';
import { InvalidTokenError, MissingTokenError } from '../../domain/errors/auth.js';
import type { AuthenticatedRoute } from '../domain/proxy.js';
import { CUSTOMER_COOKIE_NAME, extractTokenFromCookies } from './cookie.js';
import { logErrorAndFormat } from './error.js';

export function withAuth(jwtService: IJwtService, handler: AuthenticatedRoute) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
    try {
      const token = extractTokenFromCookies(event.cookies, CUSTOMER_COOKIE_NAME);
      if (!token) throw new MissingTokenError();

      let customerId: string;
      try {
        const payload = await jwtService.verify(token);
        customerId = payload.sub;
      } catch {
        throw new InvalidTokenError();
      }

      return await handler(event, customerId);
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

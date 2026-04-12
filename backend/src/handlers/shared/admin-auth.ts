import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import type { IJwtService } from '../../data/domain/auth/IJwtService.js';
import { InvalidApiKeyError, MissingApiKeyError } from '../../domain/errors/admin.js';
import { InvalidTokenError, MissingTokenError } from '../../domain/errors/auth.js';
import { ADMIN_COOKIE_NAME, extractTokenFromCookies } from './cookie.js';
import { logErrorAndFormat } from './error.js';

export type AdminAuthenticatedRoute = (
  event: APIGatewayProxyEventV2,
  adminId: string,
) => Promise<APIGatewayProxyResult>;

export function withAdminAuth(
  apiKey: string,
  jwtService: IJwtService,
  handler: AdminAuthenticatedRoute,
) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
    try {
      const key = event.headers['x-api-key'];
      if (!key) throw new MissingApiKeyError();
      if (key !== apiKey) throw new InvalidApiKeyError();

      const token = extractTokenFromCookies(event.cookies, ADMIN_COOKIE_NAME);
      if (!token) throw new MissingTokenError();

      let adminId: string;
      try {
        const payload = await jwtService.verify(token);
        adminId = payload.sub;
      } catch {
        throw new InvalidTokenError();
      }

      return await handler(event, adminId);
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import type { IJwtService } from '../../data/domain/auth/IJwtService.js';
import { InvalidTokenError, MissingTokenError } from '../../domain/errors/auth.js';
import type { AuthenticatedRoute } from '../domain/proxy.js';
import { logErrorAndFormat } from './error.js';

export function withAuth(jwtService: IJwtService, handler: AuthenticatedRoute) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
    try {
      const authHeader = event.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) throw new MissingTokenError();

      const token = authHeader.slice(7);
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

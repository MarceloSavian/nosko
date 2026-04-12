import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import { InvalidApiKeyError, MissingApiKeyError } from '../../domain/errors/admin.js';
import { logErrorAndFormat } from './error.js';

export function withApiKey(
  apiKey: string,
  handler: (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResult>,
) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
    try {
      const key = event.headers['x-api-key'];
      if (!key) throw new MissingApiKeyError();
      if (key !== apiKey) throw new InvalidApiKeyError();
      return await handler(event);
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

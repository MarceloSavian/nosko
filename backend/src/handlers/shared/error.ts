import type { APIGatewayProxyResult } from 'aws-lambda';
import { ZodError } from 'zod/v4';
import { BaseError } from '../../shared/error.js';
import { formatResponse } from './response.js';

export const logErrorAndFormat = (error: unknown): APIGatewayProxyResult => {
  if (error instanceof BaseError) {
    return formatResponse(error.statusCode, { message: error.message });
  }
  if (error instanceof ZodError) {
    console.warn('Data validation error', error);
    return formatResponse(400, { message: error.message });
  }
  if (error instanceof Error) {
    console.error(`Error occurred while processing the request: ${error.message}`, error);
    return formatResponse(500, { message: 'Sorry we had a problem' });
  }

  console.error('Invalid error', error);
  return formatResponse(500, { message: 'Sorry we had a problem' });
};

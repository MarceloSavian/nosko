import type { APIGatewayProxyResult } from 'aws-lambda';
import { ZodError } from 'zod';
import { BaseError } from '../../shared/error.js';

export const logErrorAndFormat = (error: unknown): APIGatewayProxyResult => {
  if (error instanceof BaseError) {
    return {
      statusCode: error.statusCode,
      body: JSON.stringify({ message: error.message }),
    };
  }
  if (error instanceof ZodError) {
    console.warn('Data validation error', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: error.message }),
    };
  }
  if (error instanceof Error) {
    console.error(`Error occurred while processing the request: ${error.message}`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Sorry we had a problem' }),
    };
  }

  console.error('Invalid error', error);
  return {
    statusCode: 500,
    body: JSON.stringify({ message: 'Sorry we had a problem' }),
  };
};

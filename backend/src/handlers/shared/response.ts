import type { APIGatewayProxyResult } from 'aws-lambda';

export function formatResponse(statusCode: number, data: object): APIGatewayProxyResult {
  return {
    statusCode,
    body: JSON.stringify(data),
  };
}

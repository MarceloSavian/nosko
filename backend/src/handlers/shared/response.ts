import type { APIGatewayProxyResult } from 'aws-lambda';

const RESPONSE_HEADERS = {
  'Content-Type': 'application/json',
};

export function formatResponse(statusCode: number, data: object): APIGatewayProxyResult {
  return {
    statusCode,
    headers: RESPONSE_HEADERS,
    body: JSON.stringify(data),
  };
}

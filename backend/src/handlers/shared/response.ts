import type { APIGatewayProxyResult } from 'aws-lambda';

const RESPONSE_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
};

export function formatResponse(
  statusCode: number,
  data: object,
  extraHeaders?: Record<string, string>,
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { ...RESPONSE_HEADERS, ...extraHeaders },
    body: JSON.stringify(data),
  };
}

import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';

export type ProxyRoute = Record<
  string,
  (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResult>
>;

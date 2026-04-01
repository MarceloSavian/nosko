import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import type { IJwtService } from '../../data/domain/auth/IJwtService.js';
import {
  createTransactionInputSchema,
  updateTransactionInputSchema,
} from '../../domain/models/transaction/Transaction.js';
import type { ITransactionService } from '../../domain/usecases/transaction/ITransactionService.js';
import type { ProxyRoute } from '../domain/proxy.js';
import { withAuth } from '../shared/auth.js';
import { logErrorAndFormat } from '../shared/error.js';
import { formatResponse } from '../shared/response.js';

function extractPathParam(event: APIGatewayProxyEventV2, name: string): string {
  return event.pathParameters?.[name] ?? '';
}

export function makeListTransactionsRoute(service: ITransactionService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const yearMonth = event.queryStringParameters?.yearMonth;
      const accountId = event.queryStringParameters?.accountId;
      const categoryId = event.queryStringParameters?.categoryId;
      return formatResponse(
        200,
        await service.listTransactions(customerId, { yearMonth, accountId, categoryId }),
      );
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeCreateTransactionRoute(service: ITransactionService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = createTransactionInputSchema.parse(body);
      return formatResponse(201, await service.createTransaction(customerId, input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeUpdateTransactionRoute(service: ITransactionService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const transactionId = extractPathParam(event, 'id');
      const body = JSON.parse(event.body ?? '{}');
      const input = updateTransactionInputSchema.parse(body);
      return formatResponse(200, await service.updateTransaction(customerId, transactionId, input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeDeleteTransactionRoute(service: ITransactionService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const transactionId = extractPathParam(event, 'id');
      await service.deleteTransaction(customerId, transactionId);
      return formatResponse(204, {});
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeTransactionHandler(service: ITransactionService, jwtService: IJwtService) {
  const routes: ProxyRoute = {
    'GET /v1/transactions': withAuth(jwtService, makeListTransactionsRoute(service)),
    'POST /v1/transactions': withAuth(jwtService, makeCreateTransactionRoute(service)),
    'PUT /v1/transactions/{id}': withAuth(jwtService, makeUpdateTransactionRoute(service)),
    'DELETE /v1/transactions/{id}': withAuth(jwtService, makeDeleteTransactionRoute(service)),
  };
  return (event: APIGatewayProxyEventV2) => {
    const route = routes[event.routeKey];
    return route
      ? route(event)
      : Promise.resolve({ statusCode: 404, body: `Request path ${event.routeKey} not found` });
  };
}

// Lambda handler
let _handler: ((event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResult>) | undefined;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
  if (!_handler) {
    const { jwtService } = await import('../factories/auth.js');
    const { transactionService } = await import('../factories/transaction.js');
    _handler = makeTransactionHandler(transactionService, jwtService);
  }
  return _handler(event);
};

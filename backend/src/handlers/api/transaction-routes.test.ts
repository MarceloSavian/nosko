import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { resetMock } from '../../test/helpers/resetMock.js';
import { mockJwtService } from '../../test/mocks/MockJwtService.js';
import { mockTransactionService } from '../../test/mocks/MockTransactionService.js';
import {
  makeCreateTransactionRoute,
  makeDeleteTransactionRoute,
  makeListTransactionsRoute,
  makeTransactionHandler,
  makeUpdateTransactionRoute,
} from './transaction-routes.js';

describe('transaction-routes', () => {
  beforeEach(() => {
    resetMock(mockJwtService);
    resetMock(mockTransactionService);
  });

  const makeEvent = (overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 =>
    ({
      routeKey: 'GET /v1/transactions',
      headers: { authorization: 'Bearer valid-token' },
      pathParameters: {},
      queryStringParameters: {},
      ...overrides,
    }) as unknown as APIGatewayProxyEventV2;

  describe('makeListTransactionsRoute()', () => {
    it('should return 200 with paginated transactions', async () => {
      const route = makeListTransactionsRoute(mockTransactionService);
      const paginatedResult = {
        data: [{ id: '1', amount: -5000 }],
        total: 1,
        limit: 50,
        offset: 0,
      };
      mock.method(mockTransactionService, 'listTransactions', async () => paginatedResult);

      const result = await route(makeEvent(), 'customer-id');

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), paginatedResult);
    });
  });

  describe('makeCreateTransactionRoute()', () => {
    it('should return 201 with created transaction', async () => {
      const route = makeCreateTransactionRoute(mockTransactionService);
      const tx = { id: '1', amount: -5000 };
      mock.method(mockTransactionService, 'createTransaction', async () => tx);

      const result = await route(
        makeEvent({
          body: JSON.stringify({
            bankAccountId: '550e8400-e29b-41d4-a716-446655440000',
            amount: -50,
            transactionDate: '2024-09-15',
          }),
        }),
        'customer-id',
      );

      assert.equal(result.statusCode, 201);
      assert.deepEqual(JSON.parse(result.body), tx);
    });
  });

  describe('makeUpdateTransactionRoute()', () => {
    it('should return 200 with updated transaction', async () => {
      const route = makeUpdateTransactionRoute(mockTransactionService);
      const updated = { id: 'tx-1', amount: -7500 };
      mock.method(mockTransactionService, 'updateTransaction', async () => updated);

      const result = await route(
        makeEvent({
          pathParameters: { id: 'tx-1' },
          body: JSON.stringify({ amount: -7500 }),
        }),
        'customer-id',
      );

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), updated);
    });
  });

  describe('makeDeleteTransactionRoute()', () => {
    it('should return 204 on success', async () => {
      const route = makeDeleteTransactionRoute(mockTransactionService);
      mock.method(mockTransactionService, 'deleteTransaction', async () => {});

      const result = await route(makeEvent({ pathParameters: { id: 'tx-1' } }), 'customer-id');

      assert.equal(result.statusCode, 204);
    });
  });

  describe('makeTransactionHandler()', () => {
    it('should return 401 without a token', async () => {
      const handler = makeTransactionHandler(mockTransactionService, mockJwtService);

      const result = await handler(makeEvent({ headers: {} }));

      assert.equal(result.statusCode, 401);
    });

    it('should return 404 for unknown routes', async () => {
      const handler = makeTransactionHandler(mockTransactionService, mockJwtService);

      const result = await handler(makeEvent({ routeKey: 'PATCH /transactions' }));

      assert.equal(result.statusCode, 404);
    });
  });
});

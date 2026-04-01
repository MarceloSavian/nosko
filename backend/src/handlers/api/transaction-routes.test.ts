import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { ITransactionService } from '../../domain/usecases/transaction/ITransactionService.js';
import { resetMock } from '../../test/helpers/resetMock.js';
import { mockJwtService } from '../../test/mocks/MockJwtService.js';
import {
  makeCreateTransactionRoute,
  makeListTransactionsRoute,
  makeTransactionHandler,
} from './transaction-routes.js';

const mockTransactionService = {
  listTransactions: mock.fn(async () => []),
  createTransaction: mock.fn(async () => ({})),
  updateTransaction: mock.fn(async () => ({})),
  deleteTransaction: mock.fn(async () => {}),
} as unknown as ITransactionService & Record<string, ReturnType<typeof mock.fn>>;

describe('transaction-routes', () => {
  beforeEach(() => {
    resetMock(mockJwtService);
    for (const key of Object.keys(mockTransactionService)) {
      (mockTransactionService as Record<string, ReturnType<typeof mock.fn>>)[
        key
      ]?.mock.resetCalls();
    }
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
    it('should return 200 with transactions', async () => {
      const route = makeListTransactionsRoute(mockTransactionService);
      const transactions = [{ id: '1', amount: '-50.00' }];
      mockTransactionService.listTransactions.mock.mockImplementationOnce(async () => transactions);

      const result = await route(makeEvent(), 'customer-id');

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), transactions);
    });
  });

  describe('makeCreateTransactionRoute()', () => {
    it('should return 201 with created transaction', async () => {
      const route = makeCreateTransactionRoute(mockTransactionService);
      const tx = { id: '1', amount: '-50.00' };
      mockTransactionService.createTransaction.mock.mockImplementationOnce(async () => tx);

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

import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { IAccountService } from '../../domain/usecases/account/IAccountService.js';
import { BaseError } from '../../shared/error.js';
import { resetMock } from '../../test/helpers/resetMock.js';
import { mockJwtService } from '../../test/mocks/MockJwtService.js';
import {
  makeCreateAccountRoute,
  makeGetAccountRoute,
  makeGetOverviewRoute,
  makeListAccountsRoute,
} from './account-routes.js';

const mockAccountService = {
  listAccounts: mock.fn(async () => []),
  getAccount: mock.fn(async () => ({})),
  createAccount: mock.fn(async () => ({})),
  updateAccount: mock.fn(async () => ({})),
  deleteAccount: mock.fn(async () => {}),
  getOverview: mock.fn(async () => ({ totalsByCurrency: [] })),
} as unknown as IAccountService & Record<string, ReturnType<typeof mock.fn>>;

describe('account-routes', () => {
  beforeEach(() => {
    resetMock(mockJwtService);
    for (const key of Object.keys(mockAccountService)) {
      (mockAccountService as Record<string, ReturnType<typeof mock.fn>>)[key]?.mock.resetCalls();
    }
  });

  const makeEvent = (overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 =>
    ({
      routeKey: 'GET /v1/accounts',
      headers: { authorization: 'Bearer valid-token' },
      pathParameters: {},
      ...overrides,
    }) as unknown as APIGatewayProxyEventV2;

  describe('makeListAccountsRoute()', () => {
    it('should return 200 with accounts', async () => {
      const route = makeListAccountsRoute(mockAccountService);
      const accounts = [{ id: '1', accountName: 'Checking' }];
      (
        mockAccountService.listAccounts as unknown as ReturnType<typeof mock.fn>
      ).mock.mockImplementationOnce(async () => accounts);

      const result = await route(makeEvent(), 'customer-id');

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), accounts);
    });
  });

  describe('makeGetAccountRoute()', () => {
    it('should return 404 when not found', async () => {
      const route = makeGetAccountRoute(mockAccountService);
      (
        mockAccountService.getAccount as unknown as ReturnType<typeof mock.fn>
      ).mock.mockImplementationOnce(async () => {
        throw new BaseError('Bank account not found', 404);
      });

      const result = await route(
        makeEvent({ pathParameters: { id: 'nonexistent' } }),
        'customer-id',
      );

      assert.equal(result.statusCode, 404);
    });
  });

  describe('makeCreateAccountRoute()', () => {
    it('should return 201 with created account', async () => {
      const route = makeCreateAccountRoute(mockAccountService);
      const account = { id: '1', accountName: 'New Account' };
      (
        mockAccountService.createAccount as unknown as ReturnType<typeof mock.fn>
      ).mock.mockImplementationOnce(async () => account);

      const result = await route(
        makeEvent({
          body: JSON.stringify({
            institutionId: '550e8400-e29b-41d4-a716-446655440000',
            accountName: 'New Account',
            currencyCode: 'USD',
          }),
        }),
        'customer-id',
      );

      assert.equal(result.statusCode, 201);
      assert.deepEqual(JSON.parse(result.body), account);
    });
  });

  describe('makeGetOverviewRoute()', () => {
    it('should return 200 with overview', async () => {
      const route = makeGetOverviewRoute(mockAccountService);
      const overview = { totalsByCurrency: [{ currencyCode: 'USD', total: '1000.00' }] };
      (
        mockAccountService.getOverview as unknown as ReturnType<typeof mock.fn>
      ).mock.mockImplementationOnce(async () => overview);

      const result = await route(makeEvent(), 'customer-id');

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), overview);
    });
  });
});

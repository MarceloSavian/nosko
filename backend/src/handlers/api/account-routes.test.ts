import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { BaseError } from '../../shared/error.js';
import { resetMock } from '../../test/helpers/resetMock.js';
import { mockAccountOverviewService } from '../../test/mocks/MockAccountOverviewService.js';
import { mockAccountService } from '../../test/mocks/MockAccountService.js';
import { mockJwtService } from '../../test/mocks/MockJwtService.js';
import {
  makeAccountHandler,
  makeCreateAccountRoute,
  makeDeleteAccountRoute,
  makeGetAccountRoute,
  makeGetOverviewRoute,
  makeListAccountsRoute,
  makeUpdateAccountRoute,
} from './account-routes.js';

describe('account-routes', () => {
  beforeEach(() => {
    resetMock(mockJwtService);
    resetMock(mockAccountService);
    resetMock(mockAccountOverviewService);
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
      mock.method(mockAccountService, 'listAccounts', async () => accounts);

      const result = await route(makeEvent(), 'customer-id');

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), accounts);
    });

    it('should return 500 when service throws unexpected error', async () => {
      const route = makeListAccountsRoute(mockAccountService);
      mock.method(mockAccountService, 'listAccounts', async () => {
        throw new Error('database error');
      });

      const result = await route(makeEvent(), 'customer-id');

      assert.equal(result.statusCode, 500);
    });
  });

  describe('makeGetAccountRoute()', () => {
    it('should return 404 when not found', async () => {
      const route = makeGetAccountRoute(mockAccountService);
      mock.method(mockAccountService, 'getAccount', async () => {
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
      mock.method(mockAccountService, 'createAccount', async () => account);

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

    it('should return 400 for invalid input', async () => {
      const route = makeCreateAccountRoute(mockAccountService);

      const result = await route(
        makeEvent({ body: JSON.stringify({ accountName: '' }) }),
        'customer-id',
      );

      assert.equal(result.statusCode, 400);
    });

    it('should return error when service throws', async () => {
      const route = makeCreateAccountRoute(mockAccountService);
      mock.method(mockAccountService, 'createAccount', async () => {
        throw new BaseError('Institution not found', 404);
      });

      const result = await route(
        makeEvent({
          body: JSON.stringify({
            institutionId: '550e8400-e29b-41d4-a716-446655440000',
            accountName: 'Test',
            currencyCode: 'USD',
          }),
        }),
        'customer-id',
      );

      assert.equal(result.statusCode, 404);
    });
  });

  describe('makeGetOverviewRoute()', () => {
    it('should return 200 with overview', async () => {
      const route = makeGetOverviewRoute(mockAccountOverviewService);
      const overview = { totalsByCurrency: [{ currencyCode: 'USD', total: 100000 }] };
      mock.method(mockAccountOverviewService, 'getOverview', async () => overview);

      const result = await route(makeEvent(), 'customer-id');

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), overview);
    });

    it('should return 500 when service throws unexpected error', async () => {
      const route = makeGetOverviewRoute(mockAccountOverviewService);
      mock.method(mockAccountOverviewService, 'getOverview', async () => {
        throw new Error('unexpected');
      });

      const result = await route(makeEvent(), 'customer-id');

      assert.equal(result.statusCode, 500);
    });
  });

  describe('makeUpdateAccountRoute()', () => {
    it('should return 200 with updated account', async () => {
      const route = makeUpdateAccountRoute(mockAccountService);
      const updated = { id: '1', accountName: 'Renamed' };
      mock.method(mockAccountService, 'updateAccount', async () => updated);

      const result = await route(
        makeEvent({
          pathParameters: { id: 'acc-1' },
          body: JSON.stringify({ accountName: 'Renamed' }),
        }),
        'customer-id',
      );

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), updated);
    });

    it('should return error when service throws', async () => {
      const route = makeUpdateAccountRoute(mockAccountService);
      mock.method(mockAccountService, 'updateAccount', async () => {
        throw new BaseError('Bank account not found', 404);
      });

      const result = await route(
        makeEvent({
          pathParameters: { id: 'acc-1' },
          body: JSON.stringify({ accountName: 'Renamed' }),
        }),
        'customer-id',
      );

      assert.equal(result.statusCode, 404);
    });
  });

  describe('makeDeleteAccountRoute()', () => {
    it('should return 204 on success', async () => {
      const route = makeDeleteAccountRoute(mockAccountService);
      mock.method(mockAccountService, 'deleteAccount', async () => {});

      const result = await route(makeEvent({ pathParameters: { id: 'acc-1' } }), 'customer-id');

      assert.equal(result.statusCode, 204);
    });

    it('should return error when service throws', async () => {
      const route = makeDeleteAccountRoute(mockAccountService);
      mock.method(mockAccountService, 'deleteAccount', async () => {
        throw new BaseError('Bank account not found', 404);
      });

      const result = await route(makeEvent({ pathParameters: { id: 'acc-1' } }), 'customer-id');

      assert.equal(result.statusCode, 404);
    });
  });

  describe('makeAccountHandler()', () => {
    it('should return 401 without a token', async () => {
      const handler = makeAccountHandler(
        mockAccountService,
        mockAccountOverviewService,
        mockJwtService,
      );

      const result = await handler(makeEvent({ headers: {} }));

      assert.equal(result.statusCode, 401);
    });

    it('should return 404 for unknown routes', async () => {
      const handler = makeAccountHandler(
        mockAccountService,
        mockAccountOverviewService,
        mockJwtService,
      );

      const result = await handler(makeEvent({ routeKey: 'PATCH /accounts/unknown' }));

      assert.equal(result.statusCode, 404);
    });
  });
});

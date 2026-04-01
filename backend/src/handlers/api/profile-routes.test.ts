import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { IProfileService } from '../../domain/usecases/profile/IProfileService.js';
import { BaseError } from '../../shared/error.js';
import { resetMock } from '../../test/helpers/resetMock.js';
import { mockJwtService } from '../../test/mocks/MockJwtService.js';
import {
  makeDeleteAccountRoute,
  makeGetProfileRoute,
  makeProfileHandler,
  makeUpdateProfileRoute,
} from './profile-routes.js';

const mockProfileService = {
  getProfile: mock.fn(async () => ({})),
  updateProfile: mock.fn(async () => ({})),
  deleteAccount: mock.fn(async () => {}),
} as unknown as IProfileService & {
  getProfile: ReturnType<typeof mock.fn>;
  updateProfile: ReturnType<typeof mock.fn>;
  deleteAccount: ReturnType<typeof mock.fn>;
};

describe('profile-routes', () => {
  beforeEach(() => {
    resetMock(mockJwtService);
    mockProfileService.getProfile.mock.resetCalls();
    mockProfileService.updateProfile.mock.resetCalls();
    mockProfileService.deleteAccount.mock.resetCalls();
  });

  const customer = {
    id: 'customer-id',
    email: 'test@test.com',
    name: 'Alex',
    language: 'en',
    avatarUrl: null,
    verifiedAt: '2024-01-01T01:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  const makeEvent = (overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 =>
    ({
      routeKey: 'GET /me',
      headers: { authorization: 'Bearer valid-token' },
      ...overrides,
    }) as unknown as APIGatewayProxyEventV2;

  describe('makeGetProfileRoute()', () => {
    it('should return 200 with customer data', async () => {
      const route = makeGetProfileRoute(mockProfileService);
      mockProfileService.getProfile.mock.mockImplementationOnce(async () => customer);

      const result = await route(makeEvent(), 'customer-id');

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), customer);
    });

    it('should return 404 when customer not found', async () => {
      const route = makeGetProfileRoute(mockProfileService);
      mockProfileService.getProfile.mock.mockImplementationOnce(async () => {
        throw new BaseError('Customer not found', 404);
      });

      const result = await route(makeEvent(), 'nonexistent-id');

      assert.equal(result.statusCode, 404);
    });
  });

  describe('makeUpdateProfileRoute()', () => {
    it('should return 200 with updated customer', async () => {
      const route = makeUpdateProfileRoute(mockProfileService);
      const updated = { ...customer, name: 'Updated' };
      mockProfileService.updateProfile.mock.mockImplementationOnce(async () => updated);

      const result = await route(
        makeEvent({ body: JSON.stringify({ name: 'Updated' }) }),
        'customer-id',
      );

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), updated);
    });

    it('should return 400 for invalid input', async () => {
      const route = makeUpdateProfileRoute(mockProfileService);

      const result = await route(makeEvent({ body: JSON.stringify({ name: '' }) }), 'customer-id');

      assert.equal(result.statusCode, 400);
    });
  });

  describe('makeDeleteAccountRoute()', () => {
    it('should return 204 on success', async () => {
      const route = makeDeleteAccountRoute(mockProfileService);

      const result = await route(makeEvent(), 'customer-id');

      assert.equal(result.statusCode, 204);
    });

    it('should return 404 when customer not found', async () => {
      const route = makeDeleteAccountRoute(mockProfileService);
      mockProfileService.deleteAccount.mock.mockImplementationOnce(async () => {
        throw new BaseError('Customer not found', 404);
      });

      const result = await route(makeEvent(), 'nonexistent-id');

      assert.equal(result.statusCode, 404);
    });
  });

  describe('makeProfileHandler()', () => {
    it('should return 401 without a token', async () => {
      const handler = makeProfileHandler(mockProfileService, mockJwtService);

      const result = await handler(makeEvent({ headers: {} }));

      assert.equal(result.statusCode, 401);
    });

    it('should return 200 with valid token', async () => {
      mockJwtService.verify.mock.mockImplementationOnce(async () => ({
        sub: 'customer-id',
        email: 'test@test.com',
      }));
      mockProfileService.getProfile.mock.mockImplementationOnce(async () => customer);
      const handler = makeProfileHandler(mockProfileService, mockJwtService);

      const result = await handler(makeEvent());

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), customer);
    });

    it('should return 404 for unknown routes', async () => {
      const handler = makeProfileHandler(mockProfileService, mockJwtService);

      const result = await handler(makeEvent({ routeKey: 'PATCH /unknown' }));

      assert.equal(result.statusCode, 404);
    });
  });
});

import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { IPartnershipService } from '../../domain/usecases/partnership/IPartnershipService.js';
import { BaseError } from '../../shared/error.js';
import { resetMock } from '../../test/helpers/resetMock.js';
import { mockJwtService } from '../../test/mocks/MockJwtService.js';
import {
  makeGetPartnershipRoute,
  makeInvitePartnerRoute,
  makePartnershipHandler,
} from './partnership-routes.js';

const mockPartnershipService = {
  invitePartner: mock.fn(async () => ({})),
  listInvitations: mock.fn(async () => []),
  acceptInvitation: mock.fn(async () => ({})),
  declineInvitation: mock.fn(async () => {}),
  cancelInvitation: mock.fn(async () => {}),
  getPartnership: mock.fn(async () => ({})),
  dissolvePartnership: mock.fn(async () => {}),
  getContributionRules: mock.fn(async () => null),
  setContributionRules: mock.fn(async () => ({})),
  getSharedAccounts: mock.fn(async () => []),
  setSharedAccounts: mock.fn(async () => []),
} as unknown as IPartnershipService & Record<string, ReturnType<typeof mock.fn>>;

describe('partnership-routes', () => {
  beforeEach(() => {
    resetMock(mockJwtService);
    for (const key of Object.keys(mockPartnershipService)) {
      (mockPartnershipService as Record<string, ReturnType<typeof mock.fn>>)[
        key
      ]?.mock.resetCalls();
    }
  });

  const makeEvent = (overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 =>
    ({
      routeKey: 'GET /v1/partnership',
      headers: { authorization: 'Bearer valid-token' },
      pathParameters: {},
      ...overrides,
    }) as unknown as APIGatewayProxyEventV2;

  describe('makeInvitePartnerRoute()', () => {
    it('should return 201 with invitation', async () => {
      const route = makeInvitePartnerRoute(mockPartnershipService);
      const invitation = { id: '1', inviteeEmail: 'partner@test.com', status: 'PENDING' };
      (
        mockPartnershipService.invitePartner as unknown as ReturnType<typeof mock.fn>
      ).mock.mockImplementationOnce(async () => invitation);

      const result = await route(
        makeEvent({ body: JSON.stringify({ email: 'partner@test.com' }) }),
        'customer-id',
      );

      assert.equal(result.statusCode, 201);
      assert.deepEqual(JSON.parse(result.body), invitation);
    });
  });

  describe('makeGetPartnershipRoute()', () => {
    it('should return 200 with partnership', async () => {
      const route = makeGetPartnershipRoute(mockPartnershipService);
      const partnership = { id: '1', customerAId: 'a', customerBId: 'b' };
      (
        mockPartnershipService.getPartnership as unknown as ReturnType<typeof mock.fn>
      ).mock.mockImplementationOnce(async () => partnership);

      const result = await route(makeEvent(), 'customer-id');

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), partnership);
    });

    it('should return 404 when no partnership', async () => {
      const route = makeGetPartnershipRoute(mockPartnershipService);
      (
        mockPartnershipService.getPartnership as unknown as ReturnType<typeof mock.fn>
      ).mock.mockImplementationOnce(async () => {
        throw new BaseError('Partnership not found', 404);
      });

      const result = await route(makeEvent(), 'customer-id');

      assert.equal(result.statusCode, 404);
    });
  });

  describe('makePartnershipHandler()', () => {
    it('should return 401 without a token', async () => {
      const handler = makePartnershipHandler(mockPartnershipService, mockJwtService);

      const result = await handler(makeEvent({ headers: {} }));

      assert.equal(result.statusCode, 401);
    });

    it('should return 404 for unknown routes', async () => {
      const handler = makePartnershipHandler(mockPartnershipService, mockJwtService);

      const result = await handler(makeEvent({ routeKey: 'PATCH /partnership/unknown' }));

      assert.equal(result.statusCode, 404);
    });
  });
});

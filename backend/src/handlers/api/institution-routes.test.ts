import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { IInstitutionService } from '../../domain/usecases/institution/IInstitutionService.js';
import { resetMock } from '../../test/helpers/resetMock.js';
import { mockJwtService } from '../../test/mocks/MockJwtService.js';
import { makeInstitutionHandler, makeListInstitutionsRoute } from './institution-routes.js';

const mockInstitutionService = {
  listInstitutions: mock.fn(async () => []),
} as unknown as IInstitutionService & {
  listInstitutions: ReturnType<typeof mock.fn>;
};

describe('institution-routes', () => {
  beforeEach(() => {
    resetMock(mockJwtService);
    mockInstitutionService.listInstitutions.mock.resetCalls();
  });

  const makeEvent = (overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 =>
    ({
      routeKey: 'GET /v1/institutions',
      headers: { authorization: 'Bearer valid-token' },
      ...overrides,
    }) as unknown as APIGatewayProxyEventV2;

  describe('makeListInstitutionsRoute()', () => {
    it('should return 200 with institutions', async () => {
      const route = makeListInstitutionsRoute(mockInstitutionService);
      const institutions = [{ id: '1', name: 'Chase', countryCode: 'US', logoUrl: null }];
      mockInstitutionService.listInstitutions.mock.mockImplementationOnce(async () => institutions);

      const result = await route(makeEvent(), 'customer-id');

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), institutions);
    });
  });

  describe('makeInstitutionHandler()', () => {
    it('should return 401 without a token', async () => {
      const handler = makeInstitutionHandler(mockInstitutionService, mockJwtService);

      const result = await handler(makeEvent({ headers: {} }));

      assert.equal(result.statusCode, 401);
    });

    it('should return 404 for unknown routes', async () => {
      const handler = makeInstitutionHandler(mockInstitutionService, mockJwtService);

      const result = await handler(makeEvent({ routeKey: 'POST /institutions' }));

      assert.equal(result.statusCode, 404);
    });
  });
});

import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { IDashboardService } from '../../domain/usecases/dashboard/IDashboardService.js';
import { resetMock } from '../../test/helpers/resetMock.js';
import { mockJwtService } from '../../test/mocks/MockJwtService.js';
import { makeDashboardHandler, makeGetDashboardRoute } from './dashboard-routes.js';

const mockDashboardService = {
  getDashboard: mock.fn(async () => ({
    yearMonth: '',
    totalSpending: '0',
    budgetSummary: [],
    recentTransactions: [],
  })),
} as unknown as IDashboardService & { getDashboard: ReturnType<typeof mock.fn> };

describe('dashboard-routes', () => {
  beforeEach(() => {
    resetMock(mockJwtService);
    mockDashboardService.getDashboard.mock.resetCalls();
  });

  const makeEvent = (overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 =>
    ({
      routeKey: 'GET /v1/dashboard',
      headers: { authorization: 'Bearer valid-token' },
      queryStringParameters: { yearMonth: '2024-09' },
      ...overrides,
    }) as unknown as APIGatewayProxyEventV2;

  describe('makeGetDashboardRoute()', () => {
    it('should return 200 with dashboard data', async () => {
      const route = makeGetDashboardRoute(mockDashboardService);
      const data = {
        yearMonth: '2024-09',
        totalSpending: '-80.00',
        budgetSummary: [],
        recentTransactions: [],
      };
      mockDashboardService.getDashboard.mock.mockImplementationOnce(async () => data);

      const result = await route(makeEvent(), 'customer-id');

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), data);
    });
  });

  describe('makeDashboardHandler()', () => {
    it('should return 401 without a token', async () => {
      const handler = makeDashboardHandler(mockDashboardService, mockJwtService);

      const result = await handler(makeEvent({ headers: {} }));

      assert.equal(result.statusCode, 401);
    });

    it('should return 404 for unknown routes', async () => {
      const handler = makeDashboardHandler(mockDashboardService, mockJwtService);

      const result = await handler(makeEvent({ routeKey: 'POST /dashboard' }));

      assert.equal(result.statusCode, 404);
    });
  });
});

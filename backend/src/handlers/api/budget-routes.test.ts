import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { IBudgetCategoryService } from '../../domain/usecases/budget/IBudgetCategoryService.js';
import { BaseError } from '../../shared/error.js';
import { resetMock } from '../../test/helpers/resetMock.js';
import { mockJwtService } from '../../test/mocks/MockJwtService.js';
import { makeCreateCategoryRoute, makeListCategoriesRoute } from './budget-routes.js';

const mockCategoryService = {
  listCategories: mock.fn(async () => []),
  createCategory: mock.fn(async () => ({})),
  updateCategory: mock.fn(async () => ({})),
  deleteCategory: mock.fn(async () => {}),
} as unknown as IBudgetCategoryService & Record<string, ReturnType<typeof mock.fn>>;

describe('budget-routes', () => {
  beforeEach(() => {
    resetMock(mockJwtService);
    for (const key of Object.keys(mockCategoryService)) {
      (mockCategoryService as Record<string, ReturnType<typeof mock.fn>>)[key]?.mock.resetCalls();
    }
  });

  const makeEvent = (overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 =>
    ({
      routeKey: 'GET /budget-categories',
      headers: { authorization: 'Bearer valid-token' },
      pathParameters: {},
      ...overrides,
    }) as unknown as APIGatewayProxyEventV2;

  describe('makeListCategoriesRoute()', () => {
    it('should return 200 with categories', async () => {
      const route = makeListCategoriesRoute(mockCategoryService);
      const categories = [{ id: '1', name: 'Food', icon: null, isSystem: true }];
      mockCategoryService.listCategories.mock.mockImplementationOnce(async () => categories);

      const result = await route(makeEvent(), 'customer-id');

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), categories);
    });
  });

  describe('makeCreateCategoryRoute()', () => {
    it('should return 201 with created category', async () => {
      const route = makeCreateCategoryRoute(mockCategoryService);
      const category = { id: '1', name: 'Custom', icon: null, isSystem: false };
      mockCategoryService.createCategory.mock.mockImplementationOnce(async () => category);

      const result = await route(
        makeEvent({ body: JSON.stringify({ name: 'Custom' }) }),
        'customer-id',
      );

      assert.equal(result.statusCode, 201);
      assert.deepEqual(JSON.parse(result.body), category);
    });

    it('should return 400 for missing name', async () => {
      const route = makeCreateCategoryRoute(mockCategoryService);

      const result = await route(makeEvent({ body: JSON.stringify({}) }), 'customer-id');

      assert.equal(result.statusCode, 400);
    });
  });
});

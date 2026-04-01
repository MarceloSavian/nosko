import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { BudgetItemRecurrence, BudgetItemType } from '../../domain/models/budget/BudgetPlan.js';
import { BaseError } from '../../shared/error.js';
import { resetMock } from '../../test/helpers/resetMock.js';
import { mockBudgetCategoryService } from '../../test/mocks/MockBudgetCategoryService.js';
import { mockBudgetPlanService } from '../../test/mocks/MockBudgetPlanService.js';
import { mockJwtService } from '../../test/mocks/MockJwtService.js';
import {
  makeAddItemRoute,
  makeCreateCategoryRoute,
  makeCreatePersonalPlanRoute,
  makeGetPersonalPlanRoute,
  makeListCategoriesRoute,
} from './budget-routes.js';

describe('budget-routes', () => {
  beforeEach(() => {
    resetMock(mockJwtService);
    resetMock(mockBudgetCategoryService);
    resetMock(mockBudgetPlanService);
  });

  const makeEvent = (overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 =>
    ({
      routeKey: 'GET /v1/budget-categories',
      headers: { authorization: 'Bearer valid-token' },
      pathParameters: {},
      queryStringParameters: {},
      ...overrides,
    }) as unknown as APIGatewayProxyEventV2;

  describe('makeListCategoriesRoute()', () => {
    it('should return 200 with categories', async () => {
      const route = makeListCategoriesRoute(mockBudgetCategoryService);
      const categories = [{ id: '1', name: 'Food', icon: null, isSystem: true }];
      mock.method(mockBudgetCategoryService, 'listCategories', async () => categories);

      const result = await route(makeEvent(), 'customer-id');

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), categories);
    });
  });

  describe('makeCreateCategoryRoute()', () => {
    it('should return 201 with created category', async () => {
      const route = makeCreateCategoryRoute(mockBudgetCategoryService);
      const category = { id: '1', name: 'Custom', icon: null, isSystem: false };
      mock.method(mockBudgetCategoryService, 'createCategory', async () => category);

      const result = await route(
        makeEvent({ body: JSON.stringify({ name: 'Custom' }) }),
        'customer-id',
      );

      assert.equal(result.statusCode, 201);
      assert.deepEqual(JSON.parse(result.body), category);
    });
  });

  describe('makeGetPersonalPlanRoute()', () => {
    it('should return 200 with plan and items', async () => {
      const route = makeGetPersonalPlanRoute(mockBudgetPlanService);
      const data = { plan: { id: '1' }, items: [{ id: '2', name: 'Rent' }] };
      mock.method(mockBudgetPlanService, 'getPersonalPlan', async () => data);

      const result = await route(
        makeEvent({ queryStringParameters: { yearMonth: '2024-09' } }),
        'customer-id',
      );

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), data);
    });

    it('should return 200 with null plan when not found', async () => {
      const route = makeGetPersonalPlanRoute(mockBudgetPlanService);
      mock.method(mockBudgetPlanService, 'getPersonalPlan', async () => null);

      const result = await route(
        makeEvent({ queryStringParameters: { yearMonth: '2024-09' } }),
        'customer-id',
      );

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), { plan: null, items: [] });
    });
  });

  describe('makeCreatePersonalPlanRoute()', () => {
    it('should return 201 with created plan', async () => {
      const route = makeCreatePersonalPlanRoute(mockBudgetPlanService);
      const data = { plan: { id: '1', yearMonth: '2024-09' }, items: [] };
      mock.method(mockBudgetPlanService, 'createPersonalPlan', async () => data);

      const result = await route(
        makeEvent({ body: JSON.stringify({ yearMonth: '2024-09', currencyCode: 'USD' }) }),
        'customer-id',
      );

      assert.equal(result.statusCode, 201);
      assert.deepEqual(JSON.parse(result.body), data);
    });
  });

  describe('makeAddItemRoute()', () => {
    it('should return 201 with created item', async () => {
      const route = makeAddItemRoute(mockBudgetPlanService);
      const item = {
        id: '1',
        name: 'Rent',
        type: BudgetItemType.FIXED,
        recurrence: BudgetItemRecurrence.PERMANENT,
      };
      mock.method(mockBudgetPlanService, 'addItem', async () => item);

      const result = await route(
        makeEvent({
          pathParameters: { planId: 'plan-id' },
          body: JSON.stringify({
            categoryId: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Rent',
            plannedAmount: 2800,
            type: BudgetItemType.FIXED,
            recurrence: BudgetItemRecurrence.PERMANENT,
          }),
        }),
        'customer-id',
      );

      assert.equal(result.statusCode, 201);
      assert.deepEqual(JSON.parse(result.body), item);
    });

    it('should return 404 when plan not found', async () => {
      const route = makeAddItemRoute(mockBudgetPlanService);
      mock.method(mockBudgetPlanService, 'addItem', async () => {
        throw new BaseError('Budget plan not found', 404);
      });

      const result = await route(
        makeEvent({
          pathParameters: { planId: 'nonexistent' },
          body: JSON.stringify({
            categoryId: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Rent',
            plannedAmount: 2800,
            type: BudgetItemType.FIXED,
            recurrence: BudgetItemRecurrence.PERMANENT,
          }),
        }),
        'customer-id',
      );

      assert.equal(result.statusCode, 404);
    });
  });
});

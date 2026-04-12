import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import {
  BudgetItemDirection,
  BudgetItemRecurrence,
  BudgetItemType,
} from '../../domain/models/budget/BudgetPlan.js';
import { BaseError } from '../../shared/error.js';
import { resetMock } from '../../test/helpers/resetMock.js';
import { mockBudgetCategoryService } from '../../test/mocks/MockBudgetCategoryService.js';
import { mockBudgetPlanService } from '../../test/mocks/MockBudgetPlanService.js';
import { mockBudgetSummaryService } from '../../test/mocks/MockBudgetSummaryService.js';
import { mockJwtService } from '../../test/mocks/MockJwtService.js';
import {
  makeAddItemRoute,
  makeBudgetHandler,
  makeCreateCategoryRoute,
  makeCreateJointPlanRoute,
  makeCreatePersonalPlanRoute,
  makeDeleteCategoryRoute,
  makeDeleteItemRoute,
  makeDeleteJointPlanRoute,
  makeDeletePersonalPlanRoute,
  makeGetJointPlanRoute,
  makeGetPersonalPlanRoute,
  makeGetSummaryRoute,
  makeListCategoriesRoute,
  makeUpdateCategoryRoute,
  makeUpdateItemRoute,
} from './budget-routes.js';

describe('budget-routes', () => {
  beforeEach(() => {
    resetMock(mockJwtService);
    resetMock(mockBudgetCategoryService);
    resetMock(mockBudgetPlanService);
    resetMock(mockBudgetSummaryService);
  });

  const makeEvent = (overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 =>
    ({
      routeKey: 'GET /v1/budget-categories',
      headers: {},
      cookies: ['nosko_session=valid-token'],
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
            plannedAmount: 280000,
            direction: BudgetItemDirection.EXPENSE,
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
            plannedAmount: 280000,
            direction: BudgetItemDirection.EXPENSE,
            type: BudgetItemType.FIXED,
            recurrence: BudgetItemRecurrence.PERMANENT,
          }),
        }),
        'customer-id',
      );

      assert.equal(result.statusCode, 404);
    });
  });

  describe('makeUpdateCategoryRoute()', () => {
    it('should return 200 with updated category', async () => {
      const route = makeUpdateCategoryRoute(mockBudgetCategoryService);
      const updated = { id: '1', name: 'Renamed', icon: null, isSystem: false };
      mock.method(mockBudgetCategoryService, 'updateCategory', async () => updated);

      const result = await route(
        makeEvent({
          pathParameters: { id: 'cat-1' },
          body: JSON.stringify({ name: 'Renamed' }),
        }),
        'customer-id',
      );

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), updated);
    });

    it('should return 400 for invalid body', async () => {
      const route = makeUpdateCategoryRoute(mockBudgetCategoryService);

      const result = await route(
        makeEvent({
          pathParameters: { id: 'cat-1' },
          body: JSON.stringify({ name: '' }),
        }),
        'customer-id',
      );

      assert.equal(result.statusCode, 400);
    });
  });

  describe('makeDeleteCategoryRoute()', () => {
    it('should return 204 on success', async () => {
      const route = makeDeleteCategoryRoute(mockBudgetCategoryService);
      mock.method(mockBudgetCategoryService, 'deleteCategory', async () => {});

      const result = await route(makeEvent({ pathParameters: { id: 'cat-1' } }), 'customer-id');

      assert.equal(result.statusCode, 204);
    });
  });

  describe('makeDeletePersonalPlanRoute()', () => {
    it('should return 204 on success', async () => {
      const route = makeDeletePersonalPlanRoute(mockBudgetPlanService);
      mock.method(mockBudgetPlanService, 'deletePersonalPlan', async () => {});

      const result = await route(makeEvent({ pathParameters: { id: 'plan-1' } }), 'customer-id');

      assert.equal(result.statusCode, 204);
    });
  });

  describe('makeGetJointPlanRoute()', () => {
    it('should return 200 with joint plan and items', async () => {
      const route = makeGetJointPlanRoute(mockBudgetPlanService);
      const data = { plan: { id: 'jp-1' }, items: [{ id: 'i-1', name: 'Groceries' }] };
      mock.method(mockBudgetPlanService, 'getJointPlan', async () => data);

      const result = await route(
        makeEvent({ queryStringParameters: { yearMonth: '2024-09' } }),
        'customer-id',
      );

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), data);
    });

    it('should return 200 with null plan when not found', async () => {
      const route = makeGetJointPlanRoute(mockBudgetPlanService);
      mock.method(mockBudgetPlanService, 'getJointPlan', async () => null);

      const result = await route(
        makeEvent({ queryStringParameters: { yearMonth: '2024-09' } }),
        'customer-id',
      );

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), { plan: null, items: [] });
    });
  });

  describe('makeCreateJointPlanRoute()', () => {
    it('should return 201 with created joint plan', async () => {
      const route = makeCreateJointPlanRoute(mockBudgetPlanService);
      const data = { plan: { id: 'jp-1', yearMonth: '2024-09' }, items: [] };
      mock.method(mockBudgetPlanService, 'createJointPlan', async () => data);

      const result = await route(
        makeEvent({ body: JSON.stringify({ yearMonth: '2024-09', currencyCode: 'USD' }) }),
        'customer-id',
      );

      assert.equal(result.statusCode, 201);
      assert.deepEqual(JSON.parse(result.body), data);
    });
  });

  describe('makeDeleteJointPlanRoute()', () => {
    it('should return 204 on success', async () => {
      const route = makeDeleteJointPlanRoute(mockBudgetPlanService);
      mock.method(mockBudgetPlanService, 'deleteJointPlan', async () => {});

      const result = await route(makeEvent({ pathParameters: { id: 'jp-1' } }), 'customer-id');

      assert.equal(result.statusCode, 204);
    });
  });

  describe('makeUpdateItemRoute()', () => {
    it('should return 200 with updated item', async () => {
      const route = makeUpdateItemRoute(mockBudgetPlanService);
      const item = { id: 'item-1', name: 'Updated Rent', plannedAmount: 300000 };
      mock.method(mockBudgetPlanService, 'updateItem', async () => item);

      const result = await route(
        makeEvent({
          pathParameters: { planId: 'plan-1', id: 'item-1' },
          body: JSON.stringify({ name: 'Updated Rent', plannedAmount: 300000 }),
        }),
        'customer-id',
      );

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), item);
    });
  });

  describe('makeDeleteItemRoute()', () => {
    it('should return 204 on success', async () => {
      const route = makeDeleteItemRoute(mockBudgetPlanService);
      mock.method(mockBudgetPlanService, 'deleteItem', async () => {});

      const result = await route(
        makeEvent({ pathParameters: { planId: 'plan-1', id: 'item-1' } }),
        'customer-id',
      );

      assert.equal(result.statusCode, 204);
    });
  });

  describe('makeGetSummaryRoute()', () => {
    it('should return 200 with budget summary', async () => {
      const route = makeGetSummaryRoute(mockBudgetSummaryService);
      const summary = {
        yearMonth: '2024-09',
        personalIncome: 350000,
        personalExpenses: 30000,
        jointExpenses: 280000,
        yourJointShare: 140000,
        freeAmount: 180000,
        personalItems: [],
        jointItems: [],
      };
      mock.method(mockBudgetSummaryService, 'getSummary', async () => summary);

      const result = await route(
        makeEvent({ queryStringParameters: { yearMonth: '2024-09' } }),
        'customer-id',
      );

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), summary);
    });

    it('should return error when service throws', async () => {
      const route = makeGetSummaryRoute(mockBudgetSummaryService);
      mock.method(mockBudgetSummaryService, 'getSummary', async () => {
        throw new BaseError('Partnership not found', 404);
      });

      const result = await route(
        makeEvent({ queryStringParameters: { yearMonth: '2024-09' } }),
        'customer-id',
      );

      assert.equal(result.statusCode, 404);
    });
  });

  describe('makeCreateCategoryRoute() errors', () => {
    it('should return 400 for invalid input', async () => {
      const route = makeCreateCategoryRoute(mockBudgetCategoryService);

      const result = await route(makeEvent({ body: JSON.stringify({ name: '' }) }), 'customer-id');

      assert.equal(result.statusCode, 400);
    });
  });

  describe('makeCreatePersonalPlanRoute() errors', () => {
    it('should return 400 for invalid input', async () => {
      const route = makeCreatePersonalPlanRoute(mockBudgetPlanService);

      const result = await route(
        makeEvent({ body: JSON.stringify({ yearMonth: 'invalid' }) }),
        'customer-id',
      );

      assert.equal(result.statusCode, 400);
    });

    it('should return error when service throws', async () => {
      const route = makeCreatePersonalPlanRoute(mockBudgetPlanService);
      mock.method(mockBudgetPlanService, 'createPersonalPlan', async () => {
        throw new BaseError('Duplicate plan', 409);
      });

      const result = await route(
        makeEvent({ body: JSON.stringify({ yearMonth: '2024-09', currencyCode: 'USD' }) }),
        'customer-id',
      );

      assert.equal(result.statusCode, 409);
    });
  });

  describe('makeCreateJointPlanRoute() errors', () => {
    it('should return 400 for invalid input', async () => {
      const route = makeCreateJointPlanRoute(mockBudgetPlanService);

      const result = await route(makeEvent({ body: JSON.stringify({}) }), 'customer-id');

      assert.equal(result.statusCode, 400);
    });
  });

  describe('makeDeletePersonalPlanRoute() errors', () => {
    it('should return error when service throws', async () => {
      const route = makeDeletePersonalPlanRoute(mockBudgetPlanService);
      mock.method(mockBudgetPlanService, 'deletePersonalPlan', async () => {
        throw new BaseError('Budget plan not found', 404);
      });

      const result = await route(
        makeEvent({ pathParameters: { id: 'nonexistent' } }),
        'customer-id',
      );

      assert.equal(result.statusCode, 404);
    });
  });

  describe('makeDeleteJointPlanRoute() errors', () => {
    it('should return error when service throws', async () => {
      const route = makeDeleteJointPlanRoute(mockBudgetPlanService);
      mock.method(mockBudgetPlanService, 'deleteJointPlan', async () => {
        throw new BaseError('Budget plan not found', 404);
      });

      const result = await route(
        makeEvent({ pathParameters: { id: 'nonexistent' } }),
        'customer-id',
      );

      assert.equal(result.statusCode, 404);
    });
  });

  describe('makeAddItemRoute() errors', () => {
    it('should return 400 for invalid input', async () => {
      const route = makeAddItemRoute(mockBudgetPlanService);

      const result = await route(
        makeEvent({
          pathParameters: { planId: 'plan-id' },
          body: JSON.stringify({ name: '' }),
        }),
        'customer-id',
      );

      assert.equal(result.statusCode, 400);
    });
  });

  describe('makeUpdateItemRoute() errors', () => {
    it('should return error when service throws', async () => {
      const route = makeUpdateItemRoute(mockBudgetPlanService);
      mock.method(mockBudgetPlanService, 'updateItem', async () => {
        throw new BaseError('Budget item not found', 404);
      });

      const result = await route(
        makeEvent({
          pathParameters: { planId: 'plan-1', id: 'item-1' },
          body: JSON.stringify({ name: 'Updated' }),
        }),
        'customer-id',
      );

      assert.equal(result.statusCode, 404);
    });
  });

  describe('makeDeleteItemRoute() errors', () => {
    it('should return error when service throws', async () => {
      const route = makeDeleteItemRoute(mockBudgetPlanService);
      mock.method(mockBudgetPlanService, 'deleteItem', async () => {
        throw new BaseError('Budget item not found', 404);
      });

      const result = await route(
        makeEvent({ pathParameters: { planId: 'plan-1', id: 'item-1' } }),
        'customer-id',
      );

      assert.equal(result.statusCode, 404);
    });
  });

  describe('makeBudgetHandler()', () => {
    it('should return 401 without a token', async () => {
      const handler = makeBudgetHandler(
        mockBudgetCategoryService,
        mockBudgetPlanService,
        mockBudgetSummaryService,
        mockJwtService,
      );

      const result = await handler(makeEvent({ cookies: undefined }));

      assert.equal(result.statusCode, 401);
    });

    it('should return 404 for unknown routes', async () => {
      const handler = makeBudgetHandler(
        mockBudgetCategoryService,
        mockBudgetPlanService,
        mockBudgetSummaryService,
        mockJwtService,
      );

      const result = await handler(makeEvent({ routeKey: 'PATCH /v1/budget/unknown' }));

      assert.equal(result.statusCode, 404);
    });

    it('should route GET /v1/budget-categories correctly', async () => {
      const handler = makeBudgetHandler(
        mockBudgetCategoryService,
        mockBudgetPlanService,
        mockBudgetSummaryService,
        mockJwtService,
      );
      mock.method(mockJwtService, 'verify', async () => ({ sub: 'customer-id', email: 'a@b.com' }));
      mock.method(mockBudgetCategoryService, 'listCategories', async () => []);

      const result = await handler(
        makeEvent({
          routeKey: 'GET /v1/budget-categories',
          headers: {},
          cookies: ['nosko_session=t'],
        }),
      );

      assert.equal(result.statusCode, 200);
    });
  });
});

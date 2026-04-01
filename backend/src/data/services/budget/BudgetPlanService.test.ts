import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import { BudgetItemNotFoundError, BudgetPlanNotFoundError } from '../../../domain/errors/budget.js';
import {
  BudgetItemDirection,
  BudgetItemRecurrence,
  BudgetItemType,
} from '../../../domain/models/budget/BudgetPlan.js';
import { resetMock } from '../../../test/helpers/resetMock.js';
import { mockBudgetItemRepository } from '../../../test/mocks/MockBudgetItemRepository.js';
import { mockBudgetPlanRepository } from '../../../test/mocks/MockBudgetPlanRepository.js';
import { mockPartnershipRepository } from '../../../test/mocks/MockPartnershipRepository.js';
import { BudgetPlanService } from './BudgetPlanService.js';

describe('BudgetPlanService', () => {
  const makeSut = () => {
    const sut = new BudgetPlanService(
      mockBudgetPlanRepository,
      mockBudgetItemRepository,
      mockPartnershipRepository,
    );
    return { sut };
  };

  const plan = {
    id: 'plan-id',
    customerId: 'customer-id',
    partnershipId: null,
    yearMonth: '2024-09',
    currencyCode: 'USD',
    isJoint: false,
    createdAt: '2024-09-01T00:00:00.000Z',
    updatedAt: '2024-09-01T00:00:00.000Z',
  };

  const item = {
    id: 'item-id',
    planId: 'plan-id',
    categoryId: 'cat-id',
    name: 'Rent',
    plannedAmount: 280000,
    direction: BudgetItemDirection.EXPENSE,
    type: BudgetItemType.FIXED,
    recurrence: BudgetItemRecurrence.PERMANENT,
    installmentTotal: null,
    installmentNumber: null,
    sourceItemId: null,
    createdAt: '2024-09-01T00:00:00.000Z',
    updatedAt: '2024-09-01T00:00:00.000Z',
  };

  beforeEach(() => {
    mock.restoreAll();
    resetMock(mockBudgetPlanRepository);
    resetMock(mockBudgetItemRepository);
    resetMock(mockPartnershipRepository);
  });

  describe('getPersonalPlan()', () => {
    it('should return plan with items when found', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetPlanRepository, 'findByCustomerAndMonth', async () => plan);
      mock.method(mockBudgetItemRepository, 'findByPlanId', async () => [item]);

      const result = await sut.getPersonalPlan('customer-id', '2024-09');

      assert.deepEqual(result, { plan, items: [item] });
    });

    it('should return null when no plan exists', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetPlanRepository, 'findByCustomerAndMonth', async () => null);

      const result = await sut.getPersonalPlan('customer-id', '2024-09');

      assert.equal(result, null);
    });
  });

  describe('createPersonalPlan()', () => {
    it('should create plan and carry forward items from previous month', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetPlanRepository, 'insertPersonal', async () => plan);
      // No previous plan
      mock.method(mockBudgetPlanRepository, 'findByCustomerAndMonth', async () => null);

      const result = await sut.createPersonalPlan('customer-id', {
        yearMonth: '2024-09',
        currencyCode: 'USD',
      });

      assert.deepEqual(result, { plan, items: [] });
    });
  });

  describe('addItem()', () => {
    it('should add an item to the plan', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetPlanRepository, 'findById', async () => plan);
      mock.method(mockBudgetItemRepository, 'insert', async () => item);

      const result = await sut.addItem('plan-id', {
        categoryId: 'cat-id',
        name: 'Rent',
        plannedAmount: 280000,
        direction: BudgetItemDirection.EXPENSE,
        type: BudgetItemType.FIXED,
        recurrence: BudgetItemRecurrence.PERMANENT,
      });

      assert.deepEqual(result, item);
    });

    it('should throw BudgetPlanNotFoundError when plan not found', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetPlanRepository, 'findById', async () => null);

      await assert.rejects(
        async () =>
          sut.addItem('nonexistent', {
            categoryId: 'cat-id',
            name: 'Rent',
            plannedAmount: 280000,
            direction: BudgetItemDirection.EXPENSE,
            type: BudgetItemType.FIXED,
            recurrence: BudgetItemRecurrence.PERMANENT,
          }),
        new BudgetPlanNotFoundError(),
      );
    });
  });

  describe('updateItem()', () => {
    it('should throw BudgetItemNotFoundError when item not found', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetItemRepository, 'findById', async () => null);

      await assert.rejects(
        async () => sut.updateItem('plan-id', 'nonexistent', { name: 'New' }),
        new BudgetItemNotFoundError(),
      );
    });
  });

  describe('deleteItem()', () => {
    it('should delete the item', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetItemRepository, 'findById', async () => item);

      await sut.deleteItem('plan-id', 'item-id');

      assert.equal(mockBudgetItemRepository.delete.mock.calls[0]?.arguments[0], 'item-id');
    });
  });
});

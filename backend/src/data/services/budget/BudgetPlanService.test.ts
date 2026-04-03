import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import {
  BudgetItemNotFoundError,
  BudgetPlanAlreadyExistsError,
  BudgetPlanNotFoundError,
} from '../../../domain/errors/budget.js';
import { PartnershipNotFoundError } from '../../../domain/errors/partnership.js';
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
    it('should create plan with no carry-forward when no previous plan exists', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetPlanRepository, 'insertPersonal', async () => plan);
      mock.method(mockBudgetPlanRepository, 'findByCustomerAndMonth', async () => null);

      const result = await sut.createPersonalPlan('customer-id', {
        yearMonth: '2024-09',
        currencyCode: 'USD',
      });

      assert.deepEqual(result, { plan, items: [] });
    });

    it('should throw BudgetPlanAlreadyExistsError when plan already exists for the month', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetPlanRepository, 'findByCustomerAndMonth', async () => plan);

      await assert.rejects(
        async () =>
          sut.createPersonalPlan('customer-id', {
            yearMonth: '2024-09',
            currencyCode: 'USD',
          }),
        new BudgetPlanAlreadyExistsError(),
      );
    });

    it('should carry forward PERMANENT items from previous month', async () => {
      const { sut } = makeSut();
      const newPlan = { ...plan, id: 'new-plan-id', yearMonth: '2024-10' };
      const prevPlan = { ...plan, id: 'prev-plan-id', yearMonth: '2024-09' };
      const permanentItem = {
        ...item,
        id: 'perm-item',
        recurrence: BudgetItemRecurrence.PERMANENT,
      };
      const copiedItem = {
        ...permanentItem,
        id: 'copied-perm',
        planId: 'new-plan-id',
        sourceItemId: 'perm-item',
      };

      mock.method(mockBudgetPlanRepository, 'insertPersonal', async () => newPlan);
      let findCallCount = 0;
      mock.method(mockBudgetPlanRepository, 'findByCustomerAndMonth', async () => {
        findCallCount++;
        return findCallCount === 1 ? null : prevPlan;
      });
      mock.method(mockBudgetItemRepository, 'findByPlanId', async () => [permanentItem]);
      mock.method(mockBudgetItemRepository, 'insert', async () => copiedItem);

      const result = await sut.createPersonalPlan('customer-id', {
        yearMonth: '2024-10',
        currencyCode: 'USD',
      });

      assert.deepEqual(result, { plan: newPlan, items: [copiedItem] });
      assert.equal(mockBudgetItemRepository.insert.mock.calls.length, 1);
      const insertArgs = mockBudgetItemRepository.insert.mock.calls[0]?.arguments;
      assert.equal(insertArgs?.[0], 'new-plan-id');
      assert.equal(insertArgs?.[1]?.recurrence, BudgetItemRecurrence.PERMANENT);
      assert.equal(insertArgs?.[2], undefined); // no installment number
      assert.equal(insertArgs?.[3], 'perm-item'); // sourceItemId
    });

    it('should skip ONE_TIME items during carry-forward', async () => {
      const { sut } = makeSut();
      const newPlan = { ...plan, id: 'new-plan-id', yearMonth: '2024-10' };
      const prevPlan = { ...plan, id: 'prev-plan-id', yearMonth: '2024-09' };
      const oneTimeItem = {
        ...item,
        id: 'one-time-item',
        recurrence: BudgetItemRecurrence.ONE_TIME,
      };

      mock.method(mockBudgetPlanRepository, 'insertPersonal', async () => newPlan);
      let findCallCount = 0;
      mock.method(mockBudgetPlanRepository, 'findByCustomerAndMonth', async () => {
        findCallCount++;
        return findCallCount === 1 ? null : prevPlan;
      });
      mock.method(mockBudgetItemRepository, 'findByPlanId', async () => [oneTimeItem]);

      const result = await sut.createPersonalPlan('customer-id', {
        yearMonth: '2024-10',
        currencyCode: 'USD',
      });

      assert.deepEqual(result, { plan: newPlan, items: [] });
      assert.equal(mockBudgetItemRepository.insert.mock.calls.length, 0);
    });

    it('should carry forward INSTALLMENT items with incremented number', async () => {
      const { sut } = makeSut();
      const newPlan = { ...plan, id: 'new-plan-id', yearMonth: '2024-10' };
      const prevPlan = { ...plan, id: 'prev-plan-id', yearMonth: '2024-09' };
      const installmentItem = {
        ...item,
        id: 'inst-item',
        recurrence: BudgetItemRecurrence.INSTALLMENT,
        installmentTotal: 12,
        installmentNumber: 3,
      };
      const copiedItem = {
        ...installmentItem,
        id: 'copied-inst',
        planId: 'new-plan-id',
        installmentNumber: 4,
        sourceItemId: 'inst-item',
      };

      mock.method(mockBudgetPlanRepository, 'insertPersonal', async () => newPlan);
      let findCallCount = 0;
      mock.method(mockBudgetPlanRepository, 'findByCustomerAndMonth', async () => {
        findCallCount++;
        return findCallCount === 1 ? null : prevPlan;
      });
      mock.method(mockBudgetItemRepository, 'findByPlanId', async () => [installmentItem]);
      mock.method(mockBudgetItemRepository, 'insert', async () => copiedItem);

      const result = await sut.createPersonalPlan('customer-id', {
        yearMonth: '2024-10',
        currencyCode: 'USD',
      });

      assert.deepEqual(result, { plan: newPlan, items: [copiedItem] });
      const insertArgs = mockBudgetItemRepository.insert.mock.calls[0]?.arguments;
      assert.equal(insertArgs?.[0], 'new-plan-id');
      assert.equal(insertArgs?.[1]?.recurrence, BudgetItemRecurrence.INSTALLMENT);
      assert.equal(insertArgs?.[1]?.installmentTotal, 12);
      assert.equal(insertArgs?.[2], 4); // incremented installment number
      assert.equal(insertArgs?.[3], 'inst-item'); // sourceItemId
    });

    it('should skip INSTALLMENT items that have reached their total', async () => {
      const { sut } = makeSut();
      const newPlan = { ...plan, id: 'new-plan-id', yearMonth: '2024-10' };
      const prevPlan = { ...plan, id: 'prev-plan-id', yearMonth: '2024-09' };
      const finishedInstallment = {
        ...item,
        id: 'finished-inst',
        recurrence: BudgetItemRecurrence.INSTALLMENT,
        installmentTotal: 6,
        installmentNumber: 6,
      };

      mock.method(mockBudgetPlanRepository, 'insertPersonal', async () => newPlan);
      let findCallCount = 0;
      mock.method(mockBudgetPlanRepository, 'findByCustomerAndMonth', async () => {
        findCallCount++;
        return findCallCount === 1 ? null : prevPlan;
      });
      mock.method(mockBudgetItemRepository, 'findByPlanId', async () => [finishedInstallment]);

      const result = await sut.createPersonalPlan('customer-id', {
        yearMonth: '2024-10',
        currencyCode: 'USD',
      });

      assert.deepEqual(result, { plan: newPlan, items: [] });
      assert.equal(mockBudgetItemRepository.insert.mock.calls.length, 0);
    });

    it('should carry forward mixed items correctly', async () => {
      const { sut } = makeSut();
      const newPlan = { ...plan, id: 'new-plan-id', yearMonth: '2024-02' };
      const prevPlan = { ...plan, id: 'prev-plan-id', yearMonth: '2024-01' };

      const permanentItem = { ...item, id: 'perm-1', recurrence: BudgetItemRecurrence.PERMANENT };
      const oneTimeItem = { ...item, id: 'one-time-1', recurrence: BudgetItemRecurrence.ONE_TIME };
      const installmentItem = {
        ...item,
        id: 'inst-1',
        recurrence: BudgetItemRecurrence.INSTALLMENT,
        installmentTotal: 10,
        installmentNumber: 2,
      };

      const copiedPerm = { ...permanentItem, id: 'copied-perm', planId: 'new-plan-id' };
      const copiedInst = {
        ...installmentItem,
        id: 'copied-inst',
        planId: 'new-plan-id',
        installmentNumber: 3,
      };

      mock.method(mockBudgetPlanRepository, 'insertPersonal', async () => newPlan);
      let findCallCount = 0;
      mock.method(mockBudgetPlanRepository, 'findByCustomerAndMonth', async () => {
        findCallCount++;
        return findCallCount === 1 ? null : prevPlan;
      });
      mock.method(mockBudgetItemRepository, 'findByPlanId', async () => [
        permanentItem,
        oneTimeItem,
        installmentItem,
      ]);
      let insertCallCount = 0;
      mock.method(mockBudgetItemRepository, 'insert', async () => {
        insertCallCount++;
        return insertCallCount === 1 ? copiedPerm : copiedInst;
      });

      const result = await sut.createPersonalPlan('customer-id', {
        yearMonth: '2024-02',
        currencyCode: 'USD',
      });

      assert.equal(result.items.length, 2);
      assert.equal(mockBudgetItemRepository.insert.mock.calls.length, 2);
    });

    it('should handle year boundary for previous month (January -> December)', async () => {
      const { sut } = makeSut();
      const janPlan = { ...plan, id: 'jan-plan', yearMonth: '2025-01' };
      const decPlan = { ...plan, id: 'dec-plan', yearMonth: '2024-12' };
      const permanentItem = { ...item, id: 'perm-1', recurrence: BudgetItemRecurrence.PERMANENT };
      const copiedItem = { ...permanentItem, id: 'copied', planId: 'jan-plan' };

      mock.method(mockBudgetPlanRepository, 'insertPersonal', async () => janPlan);
      mock.method(
        mockBudgetPlanRepository,
        'findByCustomerAndMonth',
        async (_cid: string, ym: string) => {
          return ym === '2024-12' ? decPlan : null;
        },
      );
      mock.method(mockBudgetItemRepository, 'findByPlanId', async () => [permanentItem]);
      mock.method(mockBudgetItemRepository, 'insert', async () => copiedItem);

      const result = await sut.createPersonalPlan('customer-id', {
        yearMonth: '2025-01',
        currencyCode: 'USD',
      });

      assert.equal(result.items.length, 1);
      const findArgs = mockBudgetPlanRepository.findByCustomerAndMonth.mock.calls[1]?.arguments;
      assert.equal(findArgs?.[1], '2024-12');
    });
  });

  describe('getJointPlan()', () => {
    it('should return joint plan with items when found', async () => {
      const { sut } = makeSut();
      const partnership = {
        id: 'partnership-id',
        invitationId: 'inv-id',
        customerAId: 'customer-id',
        customerBId: 'partner-id',
        createdAt: '',
      };
      const jointPlan = {
        ...plan,
        id: 'joint-plan',
        partnershipId: 'partnership-id',
        isJoint: true,
      };

      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => partnership);
      mock.method(mockBudgetPlanRepository, 'findByPartnershipAndMonth', async () => jointPlan);
      mock.method(mockBudgetItemRepository, 'findByPlanId', async () => [item]);

      const result = await sut.getJointPlan('customer-id', '2024-09');

      assert.deepEqual(result, { plan: jointPlan, items: [item] });
    });

    it('should return null when no joint plan exists', async () => {
      const { sut } = makeSut();
      const partnership = {
        id: 'partnership-id',
        invitationId: 'inv-id',
        customerAId: 'customer-id',
        customerBId: 'partner-id',
        createdAt: '',
      };

      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => partnership);
      mock.method(mockBudgetPlanRepository, 'findByPartnershipAndMonth', async () => null);

      const result = await sut.getJointPlan('customer-id', '2024-09');

      assert.equal(result, null);
    });

    it('should throw PartnershipNotFoundError when no partnership', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => null);

      await assert.rejects(
        async () => sut.getJointPlan('customer-id', '2024-09'),
        new PartnershipNotFoundError(),
      );
    });
  });

  describe('createJointPlan()', () => {
    it('should create joint plan and carry forward joint items', async () => {
      const { sut } = makeSut();
      const partnership = {
        id: 'partnership-id',
        invitationId: 'inv-id',
        customerAId: 'customer-id',
        customerBId: 'partner-id',
        createdAt: '',
      };
      const jointPlan = {
        ...plan,
        id: 'joint-plan',
        partnershipId: 'partnership-id',
        isJoint: true,
      };

      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => partnership);
      mock.method(mockBudgetPlanRepository, 'insertJoint', async () => jointPlan);
      mock.method(mockBudgetPlanRepository, 'findByPartnershipAndMonth', async () => null);

      const result = await sut.createJointPlan('customer-id', {
        yearMonth: '2024-09',
        currencyCode: 'USD',
      });

      assert.deepEqual(result, { plan: jointPlan, items: [] });
    });

    it('should throw BudgetPlanAlreadyExistsError when joint plan already exists for the month', async () => {
      const { sut } = makeSut();
      const partnership = {
        id: 'partnership-id',
        invitationId: 'inv-id',
        customerAId: 'customer-id',
        customerBId: 'partner-id',
        createdAt: '',
      };
      const existingPlan = {
        ...plan,
        partnershipId: 'partnership-id',
        isJoint: true,
      };

      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => partnership);
      mock.method(mockBudgetPlanRepository, 'findByPartnershipAndMonth', async () => existingPlan);

      await assert.rejects(
        async () =>
          sut.createJointPlan('customer-id', {
            yearMonth: '2024-09',
            currencyCode: 'USD',
          }),
        new BudgetPlanAlreadyExistsError(),
      );
    });

    it('should carry forward items from previous joint plan', async () => {
      const { sut } = makeSut();
      const partnership = {
        id: 'partnership-id',
        invitationId: 'inv-id',
        customerAId: 'customer-id',
        customerBId: 'partner-id',
        createdAt: '',
      };
      const newJointPlan = {
        ...plan,
        id: 'new-joint-plan',
        partnershipId: 'partnership-id',
        isJoint: true,
        yearMonth: '2024-10',
      };
      const prevJointPlan = {
        ...plan,
        id: 'prev-joint-plan',
        partnershipId: 'partnership-id',
        isJoint: true,
        yearMonth: '2024-09',
      };
      const permanentItem = {
        ...item,
        id: 'perm-joint',
        recurrence: BudgetItemRecurrence.PERMANENT,
      };
      const copiedItem = { ...permanentItem, id: 'copied-perm-joint', planId: 'new-joint-plan' };

      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => partnership);
      mock.method(mockBudgetPlanRepository, 'insertJoint', async () => newJointPlan);
      mock.method(
        mockBudgetPlanRepository,
        'findByPartnershipAndMonth',
        async (_pid: string, ym: string) => {
          return ym === '2024-09' ? prevJointPlan : null;
        },
      );
      mock.method(mockBudgetItemRepository, 'findByPlanId', async () => [permanentItem]);
      mock.method(mockBudgetItemRepository, 'insert', async () => copiedItem);

      const result = await sut.createJointPlan('customer-id', {
        yearMonth: '2024-10',
        currencyCode: 'USD',
      });

      assert.equal(result.items.length, 1);
      assert.deepEqual(result.items[0], copiedItem);
    });

    it('should throw PartnershipNotFoundError when no partnership', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => null);

      await assert.rejects(
        async () =>
          sut.createJointPlan('customer-id', { yearMonth: '2024-09', currencyCode: 'USD' }),
        new PartnershipNotFoundError(),
      );
    });
  });

  describe('deletePersonalPlan()', () => {
    it('should delete the plan when owned by the customer', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetPlanRepository, 'findById', async () => ({
        ...plan,
        customerId: 'customer-id',
      }));

      await sut.deletePersonalPlan('customer-id', 'plan-id');

      assert.equal(mockBudgetPlanRepository.delete.mock.calls[0]?.arguments[0], 'plan-id');
    });

    it('should throw BudgetPlanNotFoundError when plan not found', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetPlanRepository, 'findById', async () => null);

      await assert.rejects(
        async () => sut.deletePersonalPlan('customer-id', 'nonexistent'),
        new BudgetPlanNotFoundError(),
      );
    });

    it('should throw BudgetPlanNotFoundError when plan belongs to another customer', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetPlanRepository, 'findById', async () => ({
        ...plan,
        customerId: 'other-customer',
      }));

      await assert.rejects(
        async () => sut.deletePersonalPlan('customer-id', 'plan-id'),
        new BudgetPlanNotFoundError(),
      );
    });
  });

  describe('deleteJointPlan()', () => {
    it('should delete the joint plan when customer is a partnership member', async () => {
      const { sut } = makeSut();
      const partnership = {
        id: 'partnership-id',
        invitationId: 'inv-id',
        customerAId: 'customer-id',
        customerBId: 'partner-id',
        createdAt: '',
      };
      const jointPlan = {
        ...plan,
        id: 'joint-plan',
        partnershipId: 'partnership-id',
        customerId: null,
        isJoint: true,
      };

      mock.method(mockBudgetPlanRepository, 'findById', async () => jointPlan);
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => partnership);

      await sut.deleteJointPlan('customer-id', 'joint-plan');

      assert.equal(mockBudgetPlanRepository.delete.mock.calls[0]?.arguments[0], 'joint-plan');
    });

    it('should throw BudgetPlanNotFoundError when plan not found', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetPlanRepository, 'findById', async () => null);

      await assert.rejects(
        async () => sut.deleteJointPlan('customer-id', 'nonexistent'),
        new BudgetPlanNotFoundError(),
      );
    });

    it('should throw BudgetPlanNotFoundError when plan has no partnershipId', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetPlanRepository, 'findById', async () => ({
        ...plan,
        partnershipId: null,
      }));

      await assert.rejects(
        async () => sut.deleteJointPlan('customer-id', 'plan-id'),
        new BudgetPlanNotFoundError(),
      );
    });

    it('should throw BudgetPlanNotFoundError when customer is not in the partnership', async () => {
      const { sut } = makeSut();
      const otherPartnership = {
        id: 'other-partnership',
        invitationId: 'inv-id',
        customerAId: 'other-a',
        customerBId: 'other-b',
        createdAt: '',
      };
      const jointPlan = {
        ...plan,
        id: 'joint-plan',
        partnershipId: 'partnership-id',
        customerId: null,
        isJoint: true,
      };

      mock.method(mockBudgetPlanRepository, 'findById', async () => jointPlan);
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => otherPartnership);

      await assert.rejects(
        async () => sut.deleteJointPlan('customer-id', 'joint-plan'),
        new BudgetPlanNotFoundError(),
      );
    });

    it('should throw BudgetPlanNotFoundError when customer has no partnership', async () => {
      const { sut } = makeSut();
      const jointPlan = {
        ...plan,
        id: 'joint-plan',
        partnershipId: 'partnership-id',
        customerId: null,
        isJoint: true,
      };

      mock.method(mockBudgetPlanRepository, 'findById', async () => jointPlan);
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => null);

      await assert.rejects(
        async () => sut.deleteJointPlan('customer-id', 'joint-plan'),
        new BudgetPlanNotFoundError(),
      );
    });
  });

  describe('addItem()', () => {
    it('should add an item to a personal plan', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetPlanRepository, 'findById', async () => plan);
      mock.method(mockBudgetItemRepository, 'insert', async () => item);

      const result = await sut.addItem('customer-id', 'plan-id', {
        categoryId: 'cat-id',
        name: 'Rent',
        plannedAmount: 280000,
        direction: BudgetItemDirection.EXPENSE,
        type: BudgetItemType.FIXED,
        recurrence: BudgetItemRecurrence.PERMANENT,
      });

      assert.deepEqual(result, item);
    });

    it('should add an item to a joint plan when customer is partnership member', async () => {
      const { sut } = makeSut();
      const jointPlan = {
        ...plan,
        customerId: null,
        partnershipId: 'partnership-id',
        isJoint: true,
      };
      const partnership = {
        id: 'partnership-id',
        invitationId: 'inv-id',
        customerAId: 'customer-id',
        customerBId: 'partner-id',
        createdAt: '',
      };
      mock.method(mockBudgetPlanRepository, 'findById', async () => jointPlan);
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => partnership);
      mock.method(mockBudgetItemRepository, 'insert', async () => item);

      const result = await sut.addItem('customer-id', 'plan-id', {
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
          sut.addItem('customer-id', 'nonexistent', {
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

    it('should throw BudgetPlanNotFoundError when customer does not own the plan', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetPlanRepository, 'findById', async () => ({
        ...plan,
        customerId: 'other-customer',
      }));

      await assert.rejects(
        async () =>
          sut.addItem('customer-id', 'plan-id', {
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
      mock.method(mockBudgetPlanRepository, 'findById', async () => plan);
      mock.method(mockBudgetItemRepository, 'findById', async () => null);

      await assert.rejects(
        async () => sut.updateItem('customer-id', 'plan-id', 'nonexistent', { name: 'New' }),
        new BudgetItemNotFoundError(),
      );
    });
  });

  describe('deleteItem()', () => {
    it('should delete the item', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetPlanRepository, 'findById', async () => plan);
      mock.method(mockBudgetItemRepository, 'findById', async () => item);

      await sut.deleteItem('customer-id', 'plan-id', 'item-id');

      assert.equal(mockBudgetItemRepository.delete.mock.calls[0]?.arguments[0], 'item-id');
    });
  });
});

import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import {
  BudgetItemDirection,
  BudgetItemRecurrence,
  BudgetItemType,
} from '../../../domain/models/budget/BudgetPlan.js';
import { ContributionType } from '../../../domain/models/partnership/Partnership.js';
import { resetMock } from '../../../test/helpers/resetMock.js';
import { mockOwnershipRepository } from '../../../test/mocks/MockBankAccountOwnershipRepository.js';
import { mockBudgetItemRepository } from '../../../test/mocks/MockBudgetItemRepository.js';
import { mockBudgetPlanRepository } from '../../../test/mocks/MockBudgetPlanRepository.js';
import { mockContributionRuleRepository } from '../../../test/mocks/MockContributionRuleRepository.js';
import { mockPartnershipRepository } from '../../../test/mocks/MockPartnershipRepository.js';
import { mockTransactionRepository } from '../../../test/mocks/MockTransactionRepository.js';
import { BudgetSummaryService } from './BudgetSummaryService.js';

describe('BudgetSummaryService', () => {
  const makeSut = () => {
    const sut = new BudgetSummaryService(
      mockBudgetPlanRepository,
      mockBudgetItemRepository,
      mockTransactionRepository,
      mockOwnershipRepository,
      mockPartnershipRepository,
      mockContributionRuleRepository,
    );
    return { sut };
  };

  const personalPlan = {
    id: 'personal-plan',
    customerId: 'customer-id',
    partnershipId: null,
    yearMonth: '2024-09',
    currencyCode: 'USD',
    isJoint: false,
    createdAt: '',
    updatedAt: '',
  };

  const salaryItem = {
    id: 'salary-item',
    planId: 'personal-plan',
    categoryId: 'cat-salary',
    name: 'Salary',
    plannedAmount: 350000,
    direction: BudgetItemDirection.INCOME,
    type: BudgetItemType.FIXED,
    recurrence: BudgetItemRecurrence.PERMANENT,
    installmentTotal: null,
    installmentNumber: null,
    sourceItemId: null,
    createdAt: '',
    updatedAt: '',
  };

  const gymItem = {
    id: 'gym-item',
    planId: 'personal-plan',
    categoryId: 'cat-fitness',
    name: 'Gym',
    plannedAmount: 5000,
    direction: BudgetItemDirection.EXPENSE,
    type: BudgetItemType.FIXED,
    recurrence: BudgetItemRecurrence.PERMANENT,
    installmentTotal: null,
    installmentNumber: null,
    sourceItemId: null,
    createdAt: '',
    updatedAt: '',
  };

  beforeEach(() => {
    mock.restoreAll();
    resetMock(mockBudgetPlanRepository);
    resetMock(mockBudgetItemRepository);
    resetMock(mockTransactionRepository);
    resetMock(mockOwnershipRepository);
    resetMock(mockPartnershipRepository);
    resetMock(mockContributionRuleRepository);
  });

  describe('getSummary()', () => {
    it('should return empty summary when no plans exist', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetPlanRepository, 'findByCustomerAndMonth', async () => null);
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => null);

      const result = await sut.getSummary('customer-id', '2024-09');

      assert.equal(result.yearMonth, '2024-09');
      assert.equal(result.personalIncome, 0);
      assert.equal(result.personalExpenses, 0);
      assert.equal(result.jointExpenses, 0);
      assert.equal(result.yourJointShare, 0);
      assert.equal(result.freeAmount, 0);
    });

    it('should calculate personal income and expenses from plan items', async () => {
      const { sut } = makeSut();
      mock.method(mockOwnershipRepository, 'findAccountIdsByCustomerId', async () => ['acc-id']);
      mock.method(mockTransactionRepository, 'findByFilters', async () => ({
        data: [],
        total: 0,
        limit: 1000,
        offset: 0,
      }));
      mock.method(mockBudgetPlanRepository, 'findByCustomerAndMonth', async () => personalPlan);
      mock.method(mockBudgetItemRepository, 'findByPlanId', async () => [salaryItem, gymItem]);
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => null);

      const result = await sut.getSummary('customer-id', '2024-09');

      assert.equal(result.personalIncome, 350000);
      assert.equal(result.personalExpenses, 5000);
      assert.equal(result.freeAmount, 345000);
      assert.equal(result.personalItems.length, 2);
    });

    it('should calculate joint share with 50/50 split', async () => {
      const { sut } = makeSut();
      const partnership = {
        id: 'partnership-id',
        invitationId: 'inv-id',
        customerAId: 'customer-id',
        customerBId: 'partner-id',
        createdAt: '',
      };
      const jointPlan = {
        ...personalPlan,
        id: 'joint-plan',
        customerId: null,
        partnershipId: 'partnership-id',
        isJoint: true,
      };
      const rentItem = {
        ...gymItem,
        id: 'rent-item',
        planId: 'joint-plan',
        name: 'Rent',
        plannedAmount: 280000,
      };

      mock.method(mockOwnershipRepository, 'findAccountIdsByCustomerId', async () => ['acc-id']);
      mock.method(mockTransactionRepository, 'findByFilters', async () => ({
        data: [],
        total: 0,
        limit: 1000,
        offset: 0,
      }));
      mock.method(mockBudgetPlanRepository, 'findByCustomerAndMonth', async () => personalPlan);
      mock.method(mockBudgetItemRepository, 'findByPlanId', async (planId: string) =>
        planId === 'personal-plan' ? [salaryItem] : [rentItem],
      );
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => partnership);
      mock.method(mockBudgetPlanRepository, 'findByPartnershipAndMonth', async () => jointPlan);
      mock.method(mockContributionRuleRepository, 'findByPartnershipId', async () => ({
        id: 'rule-id',
        partnershipId: 'partnership-id',
        type: ContributionType.EQUAL,
        customerAPercentage: null,
        customerBPercentage: null,
        createdAt: '',
        updatedAt: '',
      }));

      const result = await sut.getSummary('customer-id', '2024-09');

      assert.equal(result.jointExpenses, 280000);
      assert.equal(result.yourJointShare, 140000);
      assert.equal(result.freeAmount, 350000 - 140000);
    });

    it('should calculate joint share with custom percentage', async () => {
      const { sut } = makeSut();
      const partnership = {
        id: 'partnership-id',
        invitationId: 'inv-id',
        customerAId: 'customer-id',
        customerBId: 'partner-id',
        createdAt: '',
      };
      const jointPlan = {
        ...personalPlan,
        id: 'joint-plan',
        customerId: null,
        partnershipId: 'partnership-id',
        isJoint: true,
      };
      const rentItem = {
        ...gymItem,
        id: 'rent-item',
        planId: 'joint-plan',
        name: 'Rent',
        plannedAmount: 200000,
      };

      mock.method(mockOwnershipRepository, 'findAccountIdsByCustomerId', async () => ['acc-id']);
      mock.method(mockTransactionRepository, 'findByFilters', async () => ({
        data: [],
        total: 0,
        limit: 1000,
        offset: 0,
      }));
      mock.method(mockBudgetPlanRepository, 'findByCustomerAndMonth', async () => null);
      mock.method(mockBudgetItemRepository, 'findByPlanId', async () => [rentItem]);
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => partnership);
      mock.method(mockBudgetPlanRepository, 'findByPartnershipAndMonth', async () => jointPlan);
      mock.method(mockContributionRuleRepository, 'findByPartnershipId', async () => ({
        id: 'rule-id',
        partnershipId: 'partnership-id',
        type: ContributionType.CUSTOM_PERCENTAGE,
        customerAPercentage: 6000,
        customerBPercentage: 4000,
        createdAt: '',
        updatedAt: '',
      }));

      const result = await sut.getSummary('customer-id', '2024-09');

      assert.equal(result.yourJointShare, 120000);
    });

    it('should calculate actual amounts from linked transactions', async () => {
      const { sut } = makeSut();
      const transactions = [
        {
          id: 'tx-1',
          bankAccountId: 'acc-id',
          categoryId: null,
          budgetItemId: 'gym-item',
          amount: -4500,
          description: 'Gym payment',
          transactionDate: '2024-09-01',
          createdAt: '',
        },
      ];

      mock.method(mockOwnershipRepository, 'findAccountIdsByCustomerId', async () => ['acc-id']);
      mock.method(mockTransactionRepository, 'findByFilters', async () => ({
        data: transactions,
        total: transactions.length,
        limit: 1000,
        offset: 0,
      }));
      mock.method(mockBudgetPlanRepository, 'findByCustomerAndMonth', async () => personalPlan);
      mock.method(mockBudgetItemRepository, 'findByPlanId', async () => [gymItem]);
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => null);

      const result = await sut.getSummary('customer-id', '2024-09');

      const gymSummary = result.personalItems.find((i) => i.itemId === 'gym-item');
      assert.equal(gymSummary?.plannedAmount, 5000);
      assert.equal(gymSummary?.actualAmount, 4500);
    });
  });
});

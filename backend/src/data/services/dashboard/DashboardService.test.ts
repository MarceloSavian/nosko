import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import { resetMock } from '../../../test/helpers/resetMock.js';
import { mockBankAccountRepository } from '../../../test/mocks/MockBankAccountRepository.js';
import { mockBudgetCategoryRepository } from '../../../test/mocks/MockBudgetCategoryRepository.js';
import { mockBudgetItemRepository } from '../../../test/mocks/MockBudgetItemRepository.js';
import { mockBudgetPlanRepository } from '../../../test/mocks/MockBudgetPlanRepository.js';
import { mockTransactionRepository } from '../../../test/mocks/MockTransactionRepository.js';
import { DashboardService } from './DashboardService.js';

describe('DashboardService', () => {
  const makeSut = () => {
    const sut = new DashboardService(
      mockBankAccountRepository,
      mockBudgetPlanRepository,
      mockBudgetItemRepository,
      mockTransactionRepository,
      mockBudgetCategoryRepository,
    );
    return { sut };
  };

  beforeEach(() => {
    mock.restoreAll();
    resetMock(mockBankAccountRepository);
    resetMock(mockBudgetPlanRepository);
    resetMock(mockBudgetItemRepository);
    resetMock(mockTransactionRepository);
    resetMock(mockBudgetCategoryRepository);
  });

  describe('getDashboard()', () => {
    it('should return dashboard data with no accounts', async () => {
      const { sut } = makeSut();
      mock.method(mockBankAccountRepository, 'findByCustomerId', async () => []);
      mock.method(mockBudgetPlanRepository, 'findByCustomerAndMonth', async () => null);

      const result = await sut.getDashboard('customer-id', '2024-09');

      assert.equal(result.yearMonth, '2024-09');
      assert.equal(result.totalSpending, 0);
      assert.deepEqual(result.budgetSummary, []);
      assert.deepEqual(result.recentTransactions, []);
    });

    it('should return budget summary with planned vs actual when plan exists', async () => {
      const { sut } = makeSut();
      const account = {
        id: 'acc-id',
        customerId: 'customer-id',
        institutionId: 'inst-id',
        accountName: 'Checking',
        accountNumberLast4: null,
        currencyCode: 'USD',
        balance: 100000,
        accountType: null,
        balanceUpdatedAt: null,
        createdAt: '',
      };
      const budgetPlan = {
        id: 'plan-id',
        customerId: 'customer-id',
        partnershipId: null,
        yearMonth: '2024-09',
        currencyCode: 'USD',
        isJoint: false,
        createdAt: '',
        updatedAt: '',
      };
      const budgetItems = [
        {
          id: 'item-groceries',
          planId: 'plan-id',
          categoryId: 'cat-food',
          name: 'Groceries',
          plannedAmount: 50000,
          direction: 'EXPENSE',
          type: 'ESTIMATED',
          recurrence: 'PERMANENT',
          installmentTotal: null,
          installmentNumber: null,
          sourceItemId: null,
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'item-rent',
          planId: 'plan-id',
          categoryId: 'cat-housing',
          name: 'Rent',
          plannedAmount: 120000,
          direction: 'EXPENSE',
          type: 'FIXED',
          recurrence: 'PERMANENT',
          installmentTotal: null,
          installmentNumber: null,
          sourceItemId: null,
          createdAt: '',
          updatedAt: '',
        },
      ];
      const categories = [
        { id: 'cat-food', name: 'Food', icon: null, isSystem: true, createdAt: '' },
        { id: 'cat-housing', name: 'Housing', icon: null, isSystem: true, createdAt: '' },
      ];
      const transactions = [
        {
          id: 'tx-1',
          bankAccountId: 'acc-id',
          categoryId: 'cat-food',
          budgetItemId: 'item-groceries',
          amount: -15000,
          description: 'Supermarket',
          transactionDate: '2024-09-10',
          createdAt: '',
        },
        {
          id: 'tx-2',
          bankAccountId: 'acc-id',
          categoryId: 'cat-food',
          budgetItemId: 'item-groceries',
          amount: -8000,
          description: 'Bakery',
          transactionDate: '2024-09-12',
          createdAt: '',
        },
        {
          id: 'tx-3',
          bankAccountId: 'acc-id',
          categoryId: 'cat-housing',
          budgetItemId: 'item-rent',
          amount: -120000,
          description: 'Monthly rent',
          transactionDate: '2024-09-01',
          createdAt: '',
        },
      ];

      mock.method(mockBankAccountRepository, 'findByCustomerId', async () => [account]);
      mock.method(mockTransactionRepository, 'findByFilters', async () => ({
        data: transactions,
        total: transactions.length,
        limit: 1000,
        offset: 0,
      }));
      mock.method(mockBudgetPlanRepository, 'findByCustomerAndMonth', async () => budgetPlan);
      mock.method(mockBudgetItemRepository, 'findByPlanId', async () => budgetItems);
      mock.method(mockBudgetCategoryRepository, 'findAll', async () => categories);

      const result = await sut.getDashboard('customer-id', '2024-09');

      assert.equal(result.yearMonth, '2024-09');
      assert.equal(result.totalSpending, -143000);
      assert.equal(result.budgetSummary.length, 2);

      const grocerySummary = result.budgetSummary.find((s) => s.categoryName === 'Food');
      assert.equal(grocerySummary?.planned, 50000);
      assert.equal(grocerySummary?.actual, 23000); // abs(-15000) + abs(-8000)

      const rentSummary = result.budgetSummary.find((s) => s.categoryName === 'Housing');
      assert.equal(rentSummary?.planned, 120000);
      assert.equal(rentSummary?.actual, 120000); // abs(-120000)

      assert.equal(result.recentTransactions.length, 3);
    });

    it('should show Unknown for items with missing category', async () => {
      const { sut } = makeSut();
      const account = {
        id: 'acc-id',
        customerId: 'customer-id',
        institutionId: 'inst-id',
        accountName: 'Checking',
        accountNumberLast4: null,
        currencyCode: 'USD',
        balance: 100000,
        accountType: null,
        balanceUpdatedAt: null,
        createdAt: '',
      };
      const budgetPlan = {
        id: 'plan-id',
        customerId: 'customer-id',
        partnershipId: null,
        yearMonth: '2024-09',
        currencyCode: 'USD',
        isJoint: false,
        createdAt: '',
        updatedAt: '',
      };
      const budgetItems = [
        {
          id: 'item-1',
          planId: 'plan-id',
          categoryId: 'unknown-cat',
          name: 'Misc',
          plannedAmount: 10000,
          direction: 'EXPENSE',
          type: 'ESTIMATED',
          recurrence: 'ONE_TIME',
          installmentTotal: null,
          installmentNumber: null,
          sourceItemId: null,
          createdAt: '',
          updatedAt: '',
        },
      ];

      mock.method(mockBankAccountRepository, 'findByCustomerId', async () => [account]);
      mock.method(mockTransactionRepository, 'findByFilters', async () => ({
        data: [],
        total: 0,
        limit: 1000,
        offset: 0,
      }));
      mock.method(mockBudgetPlanRepository, 'findByCustomerAndMonth', async () => budgetPlan);
      mock.method(mockBudgetItemRepository, 'findByPlanId', async () => budgetItems);
      mock.method(mockBudgetCategoryRepository, 'findAll', async () => []);

      const result = await sut.getDashboard('customer-id', '2024-09');

      assert.equal(result.budgetSummary.length, 1);
      assert.equal(result.budgetSummary[0]?.categoryName, 'Unknown');
      assert.equal(result.budgetSummary[0]?.planned, 10000);
      assert.equal(result.budgetSummary[0]?.actual, 0);
    });

    it('should calculate total spending from transactions', async () => {
      const { sut } = makeSut();
      const account = {
        id: 'acc-id',
        customerId: 'customer-id',
        institutionId: 'inst-id',
        accountName: 'Checking',
        accountNumberLast4: null,
        currencyCode: 'USD',
        balance: 100000,
        accountType: null,
        balanceUpdatedAt: null,
        createdAt: '',
      };
      const transactions = [
        {
          id: '1',
          bankAccountId: 'acc-id',
          categoryId: null,
          budgetItemId: null,
          amount: -5000,
          description: 'Groceries',
          transactionDate: '2024-09-15',
          createdAt: '',
        },
        {
          id: '2',
          bankAccountId: 'acc-id',
          categoryId: null,
          budgetItemId: null,
          amount: -3000,
          description: 'Coffee',
          transactionDate: '2024-09-16',
          createdAt: '',
        },
      ];

      mock.method(mockBankAccountRepository, 'findByCustomerId', async () => [account]);
      mock.method(mockTransactionRepository, 'findByFilters', async () => ({
        data: transactions,
        total: transactions.length,
        limit: 1000,
        offset: 0,
      }));
      mock.method(mockBudgetPlanRepository, 'findByCustomerAndMonth', async () => null);

      const result = await sut.getDashboard('customer-id', '2024-09');

      assert.equal(result.totalSpending, -8000);
      assert.equal(result.recentTransactions.length, 2);
    });
  });
});

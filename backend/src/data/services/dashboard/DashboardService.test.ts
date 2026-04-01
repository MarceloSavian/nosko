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
      assert.equal(result.totalSpending, '0.00');
      assert.deepEqual(result.budgetSummary, []);
      assert.deepEqual(result.recentTransactions, []);
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
        balance: '1000',
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
          amount: '-50.00',
          description: 'Groceries',
          transactionDate: '2024-09-15',
          createdAt: '',
        },
        {
          id: '2',
          bankAccountId: 'acc-id',
          categoryId: null,
          budgetItemId: null,
          amount: '-30.00',
          description: 'Coffee',
          transactionDate: '2024-09-16',
          createdAt: '',
        },
      ];

      mock.method(mockBankAccountRepository, 'findByCustomerId', async () => [account]);
      mock.method(mockTransactionRepository, 'findByFilters', async () => transactions);
      mock.method(mockBudgetPlanRepository, 'findByCustomerAndMonth', async () => null);

      const result = await sut.getDashboard('customer-id', '2024-09');

      assert.equal(result.totalSpending, '-80.00');
      assert.equal(result.recentTransactions.length, 2);
    });
  });
});

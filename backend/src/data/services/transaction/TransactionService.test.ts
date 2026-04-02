import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import { BankAccountNotFoundError } from '../../../domain/errors/account.js';
import { TransactionNotFoundError } from '../../../domain/errors/transaction.js';
import { resetMock } from '../../../test/helpers/resetMock.js';
import { mockOwnershipRepository } from '../../../test/mocks/MockBankAccountOwnershipRepository.js';
import { mockBankAccountRepository } from '../../../test/mocks/MockBankAccountRepository.js';
import { mockTransactionRepository } from '../../../test/mocks/MockTransactionRepository.js';
import { TransactionService } from './TransactionService.js';

describe('TransactionService', () => {
  const makeSut = () => {
    const sut = new TransactionService(
      mockTransactionRepository,
      mockBankAccountRepository,
      mockOwnershipRepository,
    );
    return { sut };
  };

  const transaction = {
    id: 'tx-id',
    bankAccountId: 'account-id',
    categoryId: null,
    budgetItemId: null,
    amount: -5000,
    description: 'Groceries',
    transactionDate: '2024-09-15',
    createdAt: '2024-09-15T00:00:00.000Z',
  };

  beforeEach(() => {
    mock.restoreAll();
    resetMock(mockTransactionRepository);
    resetMock(mockBankAccountRepository);
    resetMock(mockOwnershipRepository);
  });

  describe('listTransactions()', () => {
    it('should return transactions for all customer accounts', async () => {
      const { sut } = makeSut();
      const paginatedResult = {
        data: [transaction],
        total: 1,
        limit: 50,
        offset: 0,
      };
      mock.method(mockOwnershipRepository, 'findAccountIdsByCustomerId', async () => [
        'account-id',
      ]);
      mock.method(mockTransactionRepository, 'findByFilters', async () => paginatedResult);

      const result = await sut.listTransactions('customer-id', {}, { limit: 50, offset: 0 });

      assert.deepEqual(result.data, [transaction]);
      assert.equal(result.total, 1);
    });

    it('should return empty result when no accounts', async () => {
      const { sut } = makeSut();

      const result = await sut.listTransactions('customer-id', {}, { limit: 50, offset: 0 });

      assert.deepEqual(result.data, []);
      assert.equal(result.total, 0);
      assert.equal(result.limit, 50);
      assert.equal(result.offset, 0);
    });

    it('should include transactions from shared accounts', async () => {
      const { sut } = makeSut();
      const partnerTransaction = { ...transaction, id: 'partner-tx', bankAccountId: 'shared-acc' };
      const paginatedResult = {
        data: [transaction, partnerTransaction],
        total: 2,
        limit: 50,
        offset: 0,
      };
      mock.method(mockOwnershipRepository, 'findAccountIdsByCustomerId', async () => [
        'account-id',
        'shared-acc',
      ]);
      mock.method(mockTransactionRepository, 'findByFilters', async () => paginatedResult);

      const result = await sut.listTransactions('customer-id', {}, { limit: 50, offset: 0 });

      assert.equal(result.total, 2);
      const filterArgs = mockTransactionRepository.findByFilters.mock.calls[0]?.arguments[0];
      assert.deepEqual(filterArgs?.bankAccountIds, ['account-id', 'shared-acc']);
    });

    it('should allow listing transactions for an owned account by ID', async () => {
      const { sut } = makeSut();
      const paginatedResult = { data: [transaction], total: 1, limit: 50, offset: 0 };
      mock.method(mockOwnershipRepository, 'isOwner', async () => true);
      mock.method(mockTransactionRepository, 'findByFilters', async () => paginatedResult);

      const result = await sut.listTransactions(
        'customer-id',
        { accountId: 'account-id' },
        { limit: 50, offset: 0 },
      );

      assert.equal(result.total, 1);
    });

    it('should return empty when filtering by unowned account', async () => {
      const { sut } = makeSut();
      mock.method(mockOwnershipRepository, 'isOwner', async () => false);

      const result = await sut.listTransactions(
        'customer-id',
        { accountId: 'not-mine' },
        { limit: 50, offset: 0 },
      );

      assert.deepEqual(result.data, []);
    });
  });

  describe('createTransaction()', () => {
    it('should create a transaction', async () => {
      const { sut } = makeSut();
      mock.method(mockBankAccountRepository, 'findById', async () => ({
        id: 'account-id',
        institutionId: 'inst-id',
        accountName: 'Checking',
        accountNumberLast4: null,
        currencyCode: 'USD',
        balance: 100000,
        accountType: null,
        balanceUpdatedAt: null,
        createdAt: '',
      }));
      mock.method(mockOwnershipRepository, 'isOwner', async () => true);
      mock.method(mockTransactionRepository, 'insert', async () => transaction);

      const result = await sut.createTransaction('customer-id', {
        bankAccountId: 'account-id',
        amount: -50,
        transactionDate: '2024-09-15',
      });

      assert.deepEqual(result, transaction);
    });

    it('should throw BankAccountNotFoundError when account not found', async () => {
      const { sut } = makeSut();
      mock.method(mockBankAccountRepository, 'findById', async () => null);

      await assert.rejects(
        async () =>
          sut.createTransaction('customer-id', {
            bankAccountId: 'nonexistent',
            amount: -50,
            transactionDate: '2024-09-15',
          }),
        new BankAccountNotFoundError(),
      );
    });
  });

  describe('deleteTransaction()', () => {
    it('should throw TransactionNotFoundError when not found', async () => {
      const { sut } = makeSut();
      mock.method(mockTransactionRepository, 'findById', async () => null);

      await assert.rejects(
        async () => sut.deleteTransaction('customer-id', 'nonexistent'),
        new TransactionNotFoundError(),
      );
    });

    it('should delete the transaction when owned', async () => {
      const { sut } = makeSut();
      mock.method(mockTransactionRepository, 'findById', async () => transaction);
      mock.method(mockOwnershipRepository, 'isOwner', async () => true);

      await sut.deleteTransaction('customer-id', 'tx-id');

      assert.equal(mockTransactionRepository.delete.mock.calls[0]?.arguments[0], 'tx-id');
    });
  });
});

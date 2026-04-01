import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import { BankAccountNotFoundError } from '../../../domain/errors/account.js';
import { TransactionNotFoundError } from '../../../domain/errors/transaction.js';
import { AccountType } from '../../../domain/models/account/Account.js';
import { resetMock } from '../../../test/helpers/resetMock.js';
import { mockBankAccountRepository } from '../../../test/mocks/MockBankAccountRepository.js';
import { mockTransactionRepository } from '../../../test/mocks/MockTransactionRepository.js';
import { TransactionService } from './TransactionService.js';

describe('TransactionService', () => {
  const makeSut = () => {
    const sut = new TransactionService(mockTransactionRepository, mockBankAccountRepository);
    return { sut };
  };

  const account = {
    id: 'account-id',
    customerId: 'customer-id',
    institutionId: 'inst-id',
    accountName: 'Checking',
    accountNumberLast4: '1234',
    currencyCode: 'USD',
    balance: 100000,
    accountType: AccountType.CHECKING,
    balanceUpdatedAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
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
  });

  describe('listTransactions()', () => {
    it('should return transactions for all customer accounts', async () => {
      const { sut } = makeSut();
      mock.method(mockBankAccountRepository, 'findByCustomerId', async () => [account]);
      mock.method(mockTransactionRepository, 'findByFilters', async () => [transaction]);

      const result = await sut.listTransactions('customer-id', {});

      assert.deepEqual(result, [transaction]);
    });

    it('should return empty array when no accounts', async () => {
      const { sut } = makeSut();
      mock.method(mockBankAccountRepository, 'findByCustomerId', async () => []);

      const result = await sut.listTransactions('customer-id', {});

      assert.deepEqual(result, []);
    });
  });

  describe('createTransaction()', () => {
    it('should create a transaction', async () => {
      const { sut } = makeSut();
      mock.method(mockBankAccountRepository, 'findById', async () => account);
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
      mock.method(mockBankAccountRepository, 'findById', async () => account);

      await sut.deleteTransaction('customer-id', 'tx-id');

      assert.equal(mockTransactionRepository.delete.mock.calls[0]?.arguments[0], 'tx-id');
    });
  });
});

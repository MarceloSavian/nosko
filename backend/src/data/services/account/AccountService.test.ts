import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import {
  BankAccountNotFoundError,
  BankAccountNotOwnedError,
} from '../../../domain/errors/account.js';
import { AccountType } from '../../../domain/models/account/Account.js';
import { resetMock } from '../../../test/helpers/resetMock.js';
import { mockBankAccountRepository } from '../../../test/mocks/MockBankAccountRepository.js';
import { AccountService } from './AccountService.js';

describe('AccountService', () => {
  const makeSut = () => {
    const sut = new AccountService(mockBankAccountRepository);
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

  beforeEach(() => {
    mock.restoreAll();
    resetMock(mockBankAccountRepository);
  });

  describe('listAccounts()', () => {
    it('should return accounts for the customer', async () => {
      const { sut } = makeSut();
      mock.method(mockBankAccountRepository, 'findByCustomerId', async () => [account]);

      const result = await sut.listAccounts('customer-id');

      assert.deepEqual(result, [account]);
    });
  });

  describe('getAccount()', () => {
    it('should return the account when owned by customer', async () => {
      const { sut } = makeSut();
      mock.method(mockBankAccountRepository, 'findById', async () => account);

      const result = await sut.getAccount('customer-id', 'account-id');

      assert.deepEqual(result, account);
    });

    it('should throw BankAccountNotFoundError when not found', async () => {
      const { sut } = makeSut();
      mock.method(mockBankAccountRepository, 'findById', async () => null);

      await assert.rejects(
        async () => sut.getAccount('customer-id', 'nonexistent'),
        new BankAccountNotFoundError(),
      );
    });

    it('should throw BankAccountNotOwnedError when not owned', async () => {
      const { sut } = makeSut();
      mock.method(mockBankAccountRepository, 'findById', async () => account);

      await assert.rejects(
        async () => sut.getAccount('other-customer', 'account-id'),
        new BankAccountNotOwnedError(),
      );
    });
  });

  describe('createAccount()', () => {
    it('should create and return the account', async () => {
      const { sut } = makeSut();
      mock.method(mockBankAccountRepository, 'insert', async () => account);

      const result = await sut.createAccount('customer-id', {
        institutionId: 'inst-id',
        accountName: 'Checking',
        currencyCode: 'USD',
        balance: 1000,
      });

      assert.deepEqual(result, account);
    });
  });

  describe('deleteAccount()', () => {
    it('should delete the account when owned', async () => {
      const { sut } = makeSut();
      mock.method(mockBankAccountRepository, 'findById', async () => account);

      await sut.deleteAccount('customer-id', 'account-id');

      assert.equal(mockBankAccountRepository.delete.mock.calls[0]?.arguments[0], 'account-id');
    });

    it('should throw BankAccountNotOwnedError when not owned', async () => {
      const { sut } = makeSut();
      mock.method(mockBankAccountRepository, 'findById', async () => account);

      await assert.rejects(
        async () => sut.deleteAccount('other-customer', 'account-id'),
        new BankAccountNotOwnedError(),
      );
    });
  });

  describe('getOverview()', () => {
    it('should return totals by currency', async () => {
      const { sut } = makeSut();
      const totals = [
        { currencyCode: 'USD', total: 4291000 },
        { currencyCode: 'EUR', total: 1245000 },
      ];
      mock.method(mockBankAccountRepository, 'getOverviewByCustomerId', async () => totals);

      const result = await sut.getOverview('customer-id');

      assert.deepEqual(result, { totalsByCurrency: totals });
    });
  });
});

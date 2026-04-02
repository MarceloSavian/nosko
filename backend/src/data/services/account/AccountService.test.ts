import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import {
  BankAccountNotFoundError,
  BankAccountNotOwnedError,
} from '../../../domain/errors/account.js';
import { AccountType } from '../../../domain/models/account/Account.js';
import { resetMock } from '../../../test/helpers/resetMock.js';
import { mockOwnershipRepository } from '../../../test/mocks/MockBankAccountOwnershipRepository.js';
import { mockBankAccountRepository } from '../../../test/mocks/MockBankAccountRepository.js';
import { AccountService } from './AccountService.js';

describe('AccountService', () => {
  const makeSut = () => {
    const sut = new AccountService(mockBankAccountRepository, mockOwnershipRepository);
    return { sut };
  };

  const account = {
    id: 'account-id',
    institutionId: 'inst-id',
    accountName: 'Checking',
    currencyCode: 'USD',
    balance: 100000,
    accountType: AccountType.CHECKING,
    balanceUpdatedAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  const partnerAccount = {
    id: 'partner-account-id',
    institutionId: 'inst-id',
    accountName: 'Partner Savings',
    currencyCode: 'USD',
    balance: 200000,
    accountType: AccountType.SAVINGS,
    balanceUpdatedAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    mock.restoreAll();
    resetMock(mockBankAccountRepository);
    resetMock(mockOwnershipRepository);
  });

  describe('listAccounts()', () => {
    it('should return accounts for the customer', async () => {
      const { sut } = makeSut();
      mock.method(mockOwnershipRepository, 'findAccountIdsByCustomerId', async () => [
        'account-id',
      ]);
      mock.method(mockBankAccountRepository, 'findByIds', async () => [account]);

      const result = await sut.listAccounts('customer-id');

      assert.deepEqual(result, [account]);
    });

    it('should return empty array when no accounts owned', async () => {
      const { sut } = makeSut();

      const result = await sut.listAccounts('customer-id');

      assert.deepEqual(result, []);
    });

    it('should include shared accounts from partner', async () => {
      const { sut } = makeSut();
      mock.method(mockOwnershipRepository, 'findAccountIdsByCustomerId', async () => [
        'account-id',
        'partner-account-id',
      ]);
      mock.method(mockBankAccountRepository, 'findByIds', async () => [account, partnerAccount]);

      const result = await sut.listAccounts('customer-id');

      assert.deepEqual(result, [account, partnerAccount]);
    });
  });

  describe('getAccount()', () => {
    it('should return the account when owned by customer', async () => {
      const { sut } = makeSut();
      mock.method(mockBankAccountRepository, 'findById', async () => account);
      mock.method(mockOwnershipRepository, 'isOwner', async () => true);

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
      mock.method(mockBankAccountRepository, 'findById', async () => partnerAccount);
      mock.method(mockOwnershipRepository, 'isOwner', async () => false);

      await assert.rejects(
        async () => sut.getAccount('customer-id', 'partner-account-id'),
        new BankAccountNotOwnedError(),
      );
    });
  });

  describe('createAccount()', () => {
    it('should create account and ownership', async () => {
      const { sut } = makeSut();
      mock.method(mockBankAccountRepository, 'insert', async () => account);

      const result = await sut.createAccount('customer-id', {
        institutionId: 'inst-id',
        accountName: 'Checking',
        currencyCode: 'USD',
        balance: 1000,
        accountType: AccountType.CHECKING,
      });

      assert.deepEqual(result, account);
      assert.equal(mockOwnershipRepository.insert.mock.calls.length, 1);
      assert.equal(mockOwnershipRepository.insert.mock.calls[0]?.arguments[0], 'account-id');
      assert.equal(mockOwnershipRepository.insert.mock.calls[0]?.arguments[1], 'customer-id');
    });
  });

  describe('updateAccount()', () => {
    it('should throw BankAccountNotOwnedError when not owned', async () => {
      const { sut } = makeSut();
      mock.method(mockBankAccountRepository, 'findById', async () => partnerAccount);
      mock.method(mockOwnershipRepository, 'isOwner', async () => false);

      await assert.rejects(
        async () =>
          sut.updateAccount('customer-id', 'partner-account-id', { accountName: 'New Name' }),
        new BankAccountNotOwnedError(),
      );
    });
  });

  describe('deleteAccount()', () => {
    it('should delete the account when owned', async () => {
      const { sut } = makeSut();
      mock.method(mockBankAccountRepository, 'findById', async () => account);
      mock.method(mockOwnershipRepository, 'isOwner', async () => true);

      await sut.deleteAccount('customer-id', 'account-id');

      assert.equal(mockBankAccountRepository.delete.mock.calls[0]?.arguments[0], 'account-id');
    });

    it('should throw BankAccountNotOwnedError when not owned', async () => {
      const { sut } = makeSut();
      mock.method(mockBankAccountRepository, 'findById', async () => account);
      mock.method(mockOwnershipRepository, 'isOwner', async () => false);

      await assert.rejects(
        async () => sut.deleteAccount('other-customer', 'account-id'),
        new BankAccountNotOwnedError(),
      );
    });
  });
});

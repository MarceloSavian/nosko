import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import type { Pool } from 'pg';
import { AccountType } from '../../../domain/models/account/Account.js';
import { createTestDb } from '../../../test/helpers/createTestDb.js';
import { BankAccountRepository } from './BankAccountRepository.js';

describe('BankAccountRepository', () => {
  let pool: Pool;
  let restore: () => void;
  let sut: BankAccountRepository;
  let customerId: string;
  let institutionId: string;

  before(() => {
    ({ pool, restore } = createTestDb());
    sut = new BankAccountRepository(pool);
  });

  beforeEach(async () => {
    restore();
    const customerResult = await pool.query<{ id: string }>(
      "INSERT INTO customers (email, password_hash) VALUES ('bank-test@test.com', 'hashed') RETURNING id",
    );
    customerId = customerResult.rows[0]!.id;

    const institutionResult = await pool.query<{ id: string }>(
      "INSERT INTO institutions (name, country_code) VALUES ('Test Bank', 'FI') RETURNING id",
    );
    institutionId = institutionResult.rows[0]!.id;
  });

  describe('insert()', () => {
    it('should insert a bank account and return the created record', async () => {
      const result = await sut.insert(customerId, {
        institutionId,
        accountName: 'My Checking',
        currencyCode: 'EUR',
        balance: 1000.5,
        accountType: AccountType.CHECKING,
      });

      assert.ok(result.id);
      assert.equal(result.customerId, customerId);
      assert.equal(result.institutionId, institutionId);
      assert.equal(result.accountName, 'My Checking');
      assert.equal(result.currencyCode, 'EUR');
      assert.equal(Number(result.balance), 1000.5);
      assert.equal(result.accountType, AccountType.CHECKING);
      assert.equal(result.accountNumberLast4, null);
      assert.equal(result.balanceUpdatedAt, null);
      assert.ok(result.createdAt);
    });

    it('should insert with optional fields', async () => {
      const result = await sut.insert(customerId, {
        institutionId,
        accountName: 'Savings',
        accountNumberLast4: '1234',
        currencyCode: 'USD',
        balance: 0,
        accountType: AccountType.SAVINGS,
      });

      assert.equal(result.accountNumberLast4, '1234');
      assert.equal(result.accountType, AccountType.SAVINGS);
    });

    it('should insert with null accountType', async () => {
      const result = await sut.insert(customerId, {
        institutionId,
        accountName: 'Untyped',
        currencyCode: 'BRL',
        balance: 0,
      });

      assert.equal(result.accountType, null);
    });
  });

  describe('findById()', () => {
    it('should return the bank account when found', async () => {
      const inserted = await sut.insert(customerId, {
        institutionId,
        accountName: 'Find Me',
        currencyCode: 'EUR',
        balance: 500,
      });

      const result = await sut.findById(inserted.id);

      assert.ok(result);
      assert.equal(result.id, inserted.id);
      assert.equal(result.accountName, 'Find Me');
    });

    it('should return null when not found', async () => {
      const result = await sut.findById('00000000-0000-0000-0000-000000000000');

      assert.equal(result, null);
    });
  });

  describe('findByCustomerId()', () => {
    it('should return an empty array when no accounts exist', async () => {
      const result = await sut.findByCustomerId(customerId);

      assert.deepEqual(result, []);
    });

    it('should return all accounts for a customer ordered by created_at', async () => {
      await sut.insert(customerId, {
        institutionId,
        accountName: 'Account A',
        currencyCode: 'EUR',
        balance: 100,
      });
      await sut.insert(customerId, {
        institutionId,
        accountName: 'Account B',
        currencyCode: 'USD',
        balance: 200,
      });

      const result = await sut.findByCustomerId(customerId);

      assert.equal(result.length, 2);
      assert.equal(result[0]!.accountName, 'Account A');
      assert.equal(result[1]!.accountName, 'Account B');
    });

    it('should not return accounts for other customers', async () => {
      const otherCustomer = await pool.query<{ id: string }>(
        "INSERT INTO customers (email, password_hash) VALUES ('other-bank@test.com', 'hashed') RETURNING id",
      );
      await sut.insert(otherCustomer.rows[0]!.id, {
        institutionId,
        accountName: 'Other Account',
        currencyCode: 'EUR',
        balance: 0,
      });

      const result = await sut.findByCustomerId(customerId);

      assert.deepEqual(result, []);
    });
  });

  describe('update()', () => {
    it('should update accountName', async () => {
      const inserted = await sut.insert(customerId, {
        institutionId,
        accountName: 'Old Name',
        currencyCode: 'EUR',
        balance: 0,
      });

      const result = await sut.update(inserted.id, { accountName: 'New Name' });

      assert.equal(result.accountName, 'New Name');
    });

    it('should update accountNumberLast4', async () => {
      const inserted = await sut.insert(customerId, {
        institutionId,
        accountName: 'Account',
        currencyCode: 'EUR',
        balance: 0,
      });

      const result = await sut.update(inserted.id, { accountNumberLast4: '5678' });

      assert.equal(result.accountNumberLast4, '5678');
    });

    it('should update balance and set balanceUpdatedAt', async () => {
      const inserted = await sut.insert(customerId, {
        institutionId,
        accountName: 'Account',
        currencyCode: 'EUR',
        balance: 0,
      });
      assert.equal(inserted.balanceUpdatedAt, null);

      const result = await sut.update(inserted.id, { balance: 999.99 });

      assert.equal(Number(result.balance), 999.99);
      assert.ok(result.balanceUpdatedAt);
    });

    it('should update accountType', async () => {
      const inserted = await sut.insert(customerId, {
        institutionId,
        accountName: 'Account',
        currencyCode: 'EUR',
        balance: 0,
      });

      const result = await sut.update(inserted.id, { accountType: AccountType.CREDIT });

      assert.equal(result.accountType, AccountType.CREDIT);
    });

    it('should update multiple fields at once', async () => {
      const inserted = await sut.insert(customerId, {
        institutionId,
        accountName: 'Account',
        currencyCode: 'EUR',
        balance: 0,
      });

      const result = await sut.update(inserted.id, {
        accountName: 'Updated',
        balance: 500,
        accountType: AccountType.INVESTMENT,
      });

      assert.equal(result.accountName, 'Updated');
      assert.equal(Number(result.balance), 500);
      assert.equal(result.accountType, AccountType.INVESTMENT);
    });
  });

  describe('delete()', () => {
    it('should delete the bank account', async () => {
      const inserted = await sut.insert(customerId, {
        institutionId,
        accountName: 'To Delete',
        currencyCode: 'EUR',
        balance: 0,
      });

      await sut.delete(inserted.id);

      const result = await sut.findById(inserted.id);
      assert.equal(result, null);
    });

    it('should not throw when deleting non-existent account', async () => {
      await assert.doesNotReject(async () => {
        await sut.delete('00000000-0000-0000-0000-000000000000');
      });
    });
  });

  describe('getOverviewByCustomerId()', () => {
    it('should return an empty array when no accounts exist', async () => {
      const result = await sut.getOverviewByCustomerId(customerId);

      assert.deepEqual(result, []);
    });

    it('should return totals grouped by currency', async () => {
      await sut.insert(customerId, {
        institutionId,
        accountName: 'EUR 1',
        currencyCode: 'EUR',
        balance: 100,
      });
      await sut.insert(customerId, {
        institutionId,
        accountName: 'EUR 2',
        currencyCode: 'EUR',
        balance: 250.5,
      });
      await sut.insert(customerId, {
        institutionId,
        accountName: 'USD 1',
        currencyCode: 'USD',
        balance: 500,
      });

      const result = await sut.getOverviewByCustomerId(customerId);

      assert.equal(result.length, 2);
      assert.equal(result[0]!.currencyCode, 'EUR');
      assert.equal(Number(result[0]!.total), 350.5);
      assert.equal(result[1]!.currencyCode, 'USD');
      assert.equal(Number(result[1]!.total), 500);
    });
  });
});

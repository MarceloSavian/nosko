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
  let institutionId: string;

  before(() => {
    ({ pool, restore } = createTestDb());
    sut = new BankAccountRepository(pool);
  });

  beforeEach(async () => {
    restore();
    const institutionResult = await pool.query<{ id: string }>(
      "INSERT INTO institutions (name, country_code) VALUES ('Test Bank', 'FI') RETURNING id",
    );
    institutionId = institutionResult.rows[0]!.id;
  });

  describe('insert()', () => {
    it('should insert a bank account and return the created record', async () => {
      const result = await sut.insert({
        institutionId,
        accountName: 'My Checking',
        currencyCode: 'EUR',
        balance: 100050,
        accountType: AccountType.CHECKING,
      });

      assert.ok(result.id);
      assert.equal(result.institutionId, institutionId);
      assert.equal(result.accountName, 'My Checking');
      assert.equal(result.currencyCode, 'EUR');
      assert.equal(result.balance, 100050);
      assert.equal(result.accountType, AccountType.CHECKING);
      assert.equal(result.accountNumberLast4, null);
      assert.equal(result.balanceUpdatedAt, null);
      assert.ok(result.createdAt);
    });

    it('should insert with optional fields', async () => {
      const result = await sut.insert({
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
      const result = await sut.insert({
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
      const inserted = await sut.insert({
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

  describe('findByIds()', () => {
    it('should return empty array for empty input', async () => {
      const result = await sut.findByIds([]);

      assert.deepEqual(result, []);
    });

    it('should return matching accounts ordered by created_at', async () => {
      const a1 = await sut.insert({
        institutionId,
        accountName: 'Account A',
        currencyCode: 'EUR',
        balance: 100,
      });
      const a2 = await sut.insert({
        institutionId,
        accountName: 'Account B',
        currencyCode: 'USD',
        balance: 200,
      });

      const result = await sut.findByIds([a1.id, a2.id]);

      assert.equal(result.length, 2);
      assert.equal(result[0]!.accountName, 'Account A');
      assert.equal(result[1]!.accountName, 'Account B');
    });
  });

  describe('update()', () => {
    it('should update accountName', async () => {
      const inserted = await sut.insert({
        institutionId,
        accountName: 'Old Name',
        currencyCode: 'EUR',
        balance: 0,
      });

      const result = await sut.update(inserted.id, { accountName: 'New Name' });

      assert.equal(result.accountName, 'New Name');
    });

    it('should update accountNumberLast4', async () => {
      const inserted = await sut.insert({
        institutionId,
        accountName: 'Account',
        currencyCode: 'EUR',
        balance: 0,
      });

      const result = await sut.update(inserted.id, { accountNumberLast4: '5678' });

      assert.equal(result.accountNumberLast4, '5678');
    });

    it('should update balance and set balanceUpdatedAt', async () => {
      const inserted = await sut.insert({
        institutionId,
        accountName: 'Account',
        currencyCode: 'EUR',
        balance: 0,
      });
      assert.equal(inserted.balanceUpdatedAt, null);

      const result = await sut.update(inserted.id, { balance: 99999 });

      assert.equal(result.balance, 99999);
      assert.ok(result.balanceUpdatedAt);
    });

    it('should update accountType', async () => {
      const inserted = await sut.insert({
        institutionId,
        accountName: 'Account',
        currencyCode: 'EUR',
        balance: 0,
      });

      const result = await sut.update(inserted.id, { accountType: AccountType.CREDIT });

      assert.equal(result.accountType, AccountType.CREDIT);
    });

    it('should update multiple fields at once', async () => {
      const inserted = await sut.insert({
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
      assert.equal(result.balance, 500);
      assert.equal(result.accountType, AccountType.INVESTMENT);
    });
  });

  describe('delete()', () => {
    it('should delete the bank account', async () => {
      const inserted = await sut.insert({
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

  describe('getOverviewByAccountIds()', () => {
    it('should return an empty array when given empty ids', async () => {
      const result = await sut.getOverviewByAccountIds([]);

      assert.deepEqual(result, []);
    });

    it('should return totals grouped by currency', async () => {
      const a1 = await sut.insert({
        institutionId,
        accountName: 'EUR 1',
        currencyCode: 'EUR',
        balance: 10000,
      });
      const a2 = await sut.insert({
        institutionId,
        accountName: 'EUR 2',
        currencyCode: 'EUR',
        balance: 25050,
      });
      const a3 = await sut.insert({
        institutionId,
        accountName: 'USD 1',
        currencyCode: 'USD',
        balance: 50000,
      });

      const result = await sut.getOverviewByAccountIds([a1.id, a2.id, a3.id]);

      assert.equal(result.length, 2);
      assert.equal(result[0]!.currencyCode, 'EUR');
      assert.equal(result[0]!.total, 35050);
      assert.equal(result[1]!.currencyCode, 'USD');
      assert.equal(result[1]!.total, 50000);
    });
  });
});

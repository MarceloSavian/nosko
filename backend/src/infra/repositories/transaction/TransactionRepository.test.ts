import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import type { Pool } from 'pg';
import { createTestDb } from '../../../test/helpers/createTestDb.js';
import { TransactionRepository } from './TransactionRepository.js';

describe('TransactionRepository', () => {
  let pool: Pool;
  let restore: () => void;
  let sut: TransactionRepository;

  const CUSTOMER_ID = '11111111-1111-1111-1111-111111111111';
  const INSTITUTION_ID = '22222222-2222-2222-2222-222222222222';
  const BANK_ACCOUNT_ID = '33333333-3333-3333-3333-333333333333';
  const BANK_ACCOUNT_B_ID = '44444444-4444-4444-4444-444444444444';
  const CATEGORY_ID = '55555555-5555-5555-5555-555555555555';

  before(() => {
    ({ pool, restore } = createTestDb());
    sut = new TransactionRepository(pool);
  });

  beforeEach(async () => {
    restore();
    await pool.query(
      "INSERT INTO customers (id, email, password_hash) VALUES ($1, 'tx@test.com', 'hashed')",
      [CUSTOMER_ID],
    );
    await pool.query(
      "INSERT INTO institutions (id, name, country_code) VALUES ($1, 'Test Bank', 'FI')",
      [INSTITUTION_ID],
    );
    await pool.query(
      "INSERT INTO bank_accounts (id, customer_id, institution_id, account_name, currency_code) VALUES ($1, $2, $3, 'Checking', 'EUR')",
      [BANK_ACCOUNT_ID, CUSTOMER_ID, INSTITUTION_ID],
    );
    await pool.query(
      "INSERT INTO bank_accounts (id, customer_id, institution_id, account_name, currency_code) VALUES ($1, $2, $3, 'Savings', 'EUR')",
      [BANK_ACCOUNT_B_ID, CUSTOMER_ID, INSTITUTION_ID],
    );
    await pool.query("INSERT INTO budget_categories (id, name) VALUES ($1, 'Food')", [CATEGORY_ID]);
  });

  describe('insert()', () => {
    it('should insert a transaction and return the created record', async () => {
      const result = await sut.insert({
        bankAccountId: BANK_ACCOUNT_ID,
        amount: -42.5,
        transactionDate: '2026-04-01',
        description: 'Grocery store',
      });

      assert.ok(result.id);
      assert.equal(result.bankAccountId, BANK_ACCOUNT_ID);
      assert.equal(Number(result.amount), -42.5);
      assert.equal(result.description, 'Grocery store');
      assert.equal(result.transactionDate, '2026-04-01');
      assert.equal(result.categoryId, null);
      assert.equal(result.budgetItemId, null);
      assert.ok(result.createdAt);
    });

    it('should insert a transaction with a category', async () => {
      const result = await sut.insert({
        bankAccountId: BANK_ACCOUNT_ID,
        amount: -10,
        transactionDate: '2026-04-02',
        categoryId: CATEGORY_ID,
      });

      assert.equal(result.categoryId, CATEGORY_ID);
    });
  });

  describe('findById()', () => {
    it('should return the transaction when found', async () => {
      const tx = await sut.insert({
        bankAccountId: BANK_ACCOUNT_ID,
        amount: -50,
        transactionDate: '2026-04-01',
      });

      const result = await sut.findById(tx.id);

      assert.ok(result);
      assert.equal(result.id, tx.id);
      assert.equal(Number(result.amount), -50);
    });

    it('should return null when not found', async () => {
      const result = await sut.findById('00000000-0000-0000-0000-000000000000');

      assert.equal(result, null);
    });
  });

  describe('findByFilters()', () => {
    it('should return an empty array when no transactions match', async () => {
      const result = await sut.findByFilters({ bankAccountIds: [BANK_ACCOUNT_ID] });

      assert.deepEqual(result, []);
    });

    it('should filter by bankAccountIds', async () => {
      await sut.insert({
        bankAccountId: BANK_ACCOUNT_ID,
        amount: -10,
        transactionDate: '2026-04-01',
      });
      await sut.insert({
        bankAccountId: BANK_ACCOUNT_B_ID,
        amount: -20,
        transactionDate: '2026-04-01',
      });

      const result = await sut.findByFilters({ bankAccountIds: [BANK_ACCOUNT_ID] });

      assert.equal(result.length, 1);
      assert.equal(result[0]?.bankAccountId, BANK_ACCOUNT_ID);
    });

    it('should filter by multiple bankAccountIds', async () => {
      await sut.insert({
        bankAccountId: BANK_ACCOUNT_ID,
        amount: -10,
        transactionDate: '2026-04-01',
      });
      await sut.insert({
        bankAccountId: BANK_ACCOUNT_B_ID,
        amount: -20,
        transactionDate: '2026-04-01',
      });

      const result = await sut.findByFilters({
        bankAccountIds: [BANK_ACCOUNT_ID, BANK_ACCOUNT_B_ID],
      });

      assert.equal(result.length, 2);
    });

    it('should filter by yearMonth', async () => {
      await sut.insert({
        bankAccountId: BANK_ACCOUNT_ID,
        amount: -10,
        transactionDate: '2026-04-15',
      });
      await sut.insert({
        bankAccountId: BANK_ACCOUNT_ID,
        amount: -20,
        transactionDate: '2026-05-01',
      });

      const result = await sut.findByFilters({
        bankAccountIds: [BANK_ACCOUNT_ID],
        yearMonth: '2026-04',
      });

      assert.equal(result.length, 1);
      assert.equal(result[0]?.transactionDate, '2026-04-15');
    });

    it('should filter by categoryId', async () => {
      await sut.insert({
        bankAccountId: BANK_ACCOUNT_ID,
        amount: -10,
        transactionDate: '2026-04-01',
        categoryId: CATEGORY_ID,
      });
      await sut.insert({
        bankAccountId: BANK_ACCOUNT_ID,
        amount: -20,
        transactionDate: '2026-04-01',
      });

      const result = await sut.findByFilters({
        bankAccountIds: [BANK_ACCOUNT_ID],
        categoryId: CATEGORY_ID,
      });

      assert.equal(result.length, 1);
      assert.equal(result[0]?.categoryId, CATEGORY_ID);
    });

    it('should return results ordered by transaction_date DESC', async () => {
      await sut.insert({
        bankAccountId: BANK_ACCOUNT_ID,
        amount: -10,
        transactionDate: '2026-04-01',
      });
      await sut.insert({
        bankAccountId: BANK_ACCOUNT_ID,
        amount: -20,
        transactionDate: '2026-04-15',
      });

      const result = await sut.findByFilters({ bankAccountIds: [BANK_ACCOUNT_ID] });

      assert.equal(result.length, 2);
      assert.equal(result[0]?.transactionDate, '2026-04-15');
      assert.equal(result[1]?.transactionDate, '2026-04-01');
    });
  });

  describe('update()', () => {
    it('should update the amount', async () => {
      const tx = await sut.insert({
        bankAccountId: BANK_ACCOUNT_ID,
        amount: -50,
        transactionDate: '2026-04-01',
      });

      const result = await sut.update(tx.id, { amount: -75 });

      assert.equal(Number(result.amount), -75);
    });

    it('should update the description', async () => {
      const tx = await sut.insert({
        bankAccountId: BANK_ACCOUNT_ID,
        amount: -50,
        transactionDate: '2026-04-01',
      });

      const result = await sut.update(tx.id, { description: 'Updated desc' });

      assert.equal(result.description, 'Updated desc');
    });

    it('should update the categoryId', async () => {
      const tx = await sut.insert({
        bankAccountId: BANK_ACCOUNT_ID,
        amount: -50,
        transactionDate: '2026-04-01',
      });

      const result = await sut.update(tx.id, { categoryId: CATEGORY_ID });

      assert.equal(result.categoryId, CATEGORY_ID);
    });

    it('should update the transactionDate', async () => {
      const tx = await sut.insert({
        bankAccountId: BANK_ACCOUNT_ID,
        amount: -50,
        transactionDate: '2026-04-01',
      });

      const result = await sut.update(tx.id, { transactionDate: '2026-04-10' });

      assert.equal(result.transactionDate, '2026-04-10');
    });
  });

  describe('delete()', () => {
    it('should delete the transaction', async () => {
      const tx = await sut.insert({
        bankAccountId: BANK_ACCOUNT_ID,
        amount: -50,
        transactionDate: '2026-04-01',
      });

      await sut.delete(tx.id);

      const result = await sut.findById(tx.id);
      assert.equal(result, null);
    });

    it('should not throw when deleting a non-existent transaction', async () => {
      await assert.doesNotReject(async () => sut.delete('00000000-0000-0000-0000-000000000000'));
    });
  });
});

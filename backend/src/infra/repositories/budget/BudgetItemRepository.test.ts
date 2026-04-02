import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import type { Pool } from 'pg';
import {
  BudgetItemDirection,
  BudgetItemRecurrence,
  BudgetItemType,
} from '../../../domain/models/budget/BudgetPlan.js';
import { createTestDb } from '../../../test/helpers/createTestDb.js';
import { BudgetItemRepository } from './BudgetItemRepository.js';

describe('BudgetItemRepository', () => {
  let pool: Pool;
  let restore: () => void;
  let sut: BudgetItemRepository;

  const CUSTOMER_ID = '11111111-1111-1111-1111-111111111111';
  const CATEGORY_ID = '55555555-5555-5555-5555-555555555555';
  const CATEGORY_B_ID = '66666666-6666-6666-6666-666666666666';
  let planId: string;

  before(() => {
    ({ pool, restore } = createTestDb());
    sut = new BudgetItemRepository(pool);
  });

  beforeEach(async () => {
    restore();
    await pool.query(
      "INSERT INTO customers (id, email, password_hash, name) VALUES ($1, 'item@test.com', 'hashed', 'Test')",
      [CUSTOMER_ID],
    );
    await pool.query("INSERT INTO budget_categories (id, name) VALUES ($1, 'Food')", [CATEGORY_ID]);
    await pool.query("INSERT INTO budget_categories (id, name) VALUES ($1, 'Rent')", [
      CATEGORY_B_ID,
    ]);
    const planResult = await pool.query<{ id: string }>(
      "INSERT INTO budget_plans (customer_id, year_month, currency_code, is_joint) VALUES ($1, '2026-04', 'EUR', false) RETURNING id",
      [CUSTOMER_ID],
    );
    const row = planResult.rows[0];
    if (!row) throw new Error('Failed to insert plan');
    planId = row.id;
  });

  describe('insert()', () => {
    it('should insert an item and return the created record', async () => {
      const result = await sut.insert(planId, {
        categoryId: CATEGORY_ID,
        name: 'Groceries',
        plannedAmount: 500,
        direction: BudgetItemDirection.EXPENSE,
        type: BudgetItemType.ESTIMATED,
        recurrence: BudgetItemRecurrence.PERMANENT,
      });

      assert.ok(result.id);
      assert.equal(result.planId, planId);
      assert.equal(result.categoryId, CATEGORY_ID);
      assert.equal(result.name, 'Groceries');
      assert.equal(Number(result.plannedAmount), 500);
      assert.equal(result.type, BudgetItemType.ESTIMATED);
      assert.equal(result.recurrence, BudgetItemRecurrence.PERMANENT);
      assert.equal(result.installmentTotal, null);
      assert.equal(result.installmentNumber, null);
      assert.equal(result.sourceItemId, null);
      assert.ok(result.createdAt);
      assert.ok(result.updatedAt);
    });

    it('should insert an installment item with installment fields', async () => {
      const source = await sut.insert(planId, {
        categoryId: CATEGORY_ID,
        name: 'Laptop',
        plannedAmount: 200,
        direction: BudgetItemDirection.EXPENSE,
        type: BudgetItemType.FIXED,
        recurrence: BudgetItemRecurrence.INSTALLMENT,
        installmentTotal: 12,
      });

      const result = await sut.insert(
        planId,
        {
          categoryId: CATEGORY_ID,
          name: 'Laptop',
          plannedAmount: 200,
          direction: BudgetItemDirection.EXPENSE,
          type: BudgetItemType.FIXED,
          recurrence: BudgetItemRecurrence.INSTALLMENT,
          installmentTotal: 12,
        },
        2,
        source.id,
      );

      assert.equal(result.installmentTotal, 12);
      assert.equal(result.installmentNumber, 2);
      assert.equal(result.sourceItemId, source.id);
    });
  });

  describe('findByPlanId()', () => {
    it('should return an empty array when no items exist', async () => {
      const result = await sut.findByPlanId(planId);

      assert.deepEqual(result, []);
    });

    it('should return all items for the plan ordered by created_at', async () => {
      await sut.insert(planId, {
        categoryId: CATEGORY_ID,
        name: 'First',
        plannedAmount: 100,
        direction: BudgetItemDirection.EXPENSE,
        type: BudgetItemType.FIXED,
        recurrence: BudgetItemRecurrence.PERMANENT,
      });
      await sut.insert(planId, {
        categoryId: CATEGORY_ID,
        name: 'Second',
        plannedAmount: 200,
        direction: BudgetItemDirection.EXPENSE,
        type: BudgetItemType.ESTIMATED,
        recurrence: BudgetItemRecurrence.ONE_TIME,
      });

      const result = await sut.findByPlanId(planId);

      assert.equal(result.length, 2);
      assert.equal(result[0]?.name, 'First');
      assert.equal(result[1]?.name, 'Second');
    });
  });

  describe('findById()', () => {
    it('should return the item when found', async () => {
      const item = await sut.insert(planId, {
        categoryId: CATEGORY_ID,
        name: 'Rent',
        plannedAmount: 1000,
        direction: BudgetItemDirection.EXPENSE,
        type: BudgetItemType.FIXED,
        recurrence: BudgetItemRecurrence.PERMANENT,
      });

      const result = await sut.findById(item.id);

      assert.ok(result);
      assert.equal(result.id, item.id);
      assert.equal(result.name, 'Rent');
    });

    it('should return null when not found', async () => {
      const result = await sut.findById('00000000-0000-0000-0000-000000000000');

      assert.equal(result, null);
    });
  });

  describe('update()', () => {
    it('should update the name', async () => {
      const item = await sut.insert(planId, {
        categoryId: CATEGORY_ID,
        name: 'Old',
        plannedAmount: 100,
        direction: BudgetItemDirection.EXPENSE,
        type: BudgetItemType.FIXED,
        recurrence: BudgetItemRecurrence.PERMANENT,
      });

      const result = await sut.update(item.id, { name: 'New' });

      assert.equal(result.name, 'New');
      assert.equal(Number(result.plannedAmount), 100);
    });

    it('should update the planned amount', async () => {
      const item = await sut.insert(planId, {
        categoryId: CATEGORY_ID,
        name: 'Item',
        plannedAmount: 100,
        direction: BudgetItemDirection.EXPENSE,
        type: BudgetItemType.FIXED,
        recurrence: BudgetItemRecurrence.PERMANENT,
      });

      const result = await sut.update(item.id, { plannedAmount: 250 });

      assert.equal(Number(result.plannedAmount), 250);
    });

    it('should update the category', async () => {
      const item = await sut.insert(planId, {
        categoryId: CATEGORY_ID,
        name: 'Item',
        plannedAmount: 100,
        direction: BudgetItemDirection.EXPENSE,
        type: BudgetItemType.FIXED,
        recurrence: BudgetItemRecurrence.PERMANENT,
      });

      const result = await sut.update(item.id, { categoryId: CATEGORY_B_ID });

      assert.equal(result.categoryId, CATEGORY_B_ID);
    });
  });

  describe('delete()', () => {
    it('should delete the item', async () => {
      const item = await sut.insert(planId, {
        categoryId: CATEGORY_ID,
        name: 'ToDelete',
        plannedAmount: 100,
        direction: BudgetItemDirection.EXPENSE,
        type: BudgetItemType.FIXED,
        recurrence: BudgetItemRecurrence.PERMANENT,
      });

      await sut.delete(item.id);

      const result = await sut.findById(item.id);
      assert.equal(result, null);
    });

    it('should not throw when deleting a non-existent item', async () => {
      await assert.doesNotReject(async () => sut.delete('00000000-0000-0000-0000-000000000000'));
    });
  });
});

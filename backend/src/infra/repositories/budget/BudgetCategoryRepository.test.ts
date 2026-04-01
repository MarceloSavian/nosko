import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import type { Pool } from 'pg';
import { createTestDb } from '../../../test/helpers/createTestDb.js';
import { BudgetCategoryRepository } from './BudgetCategoryRepository.js';

describe('BudgetCategoryRepository', () => {
  let pool: Pool;
  let restore: () => void;
  let sut: BudgetCategoryRepository;

  before(() => {
    ({ pool, restore } = createTestDb());
    sut = new BudgetCategoryRepository(pool);
  });

  beforeEach(() => {
    restore();
  });

  describe('insert()', () => {
    it('should insert a category and return the created record', async () => {
      const result = await sut.insert({ name: 'Food' });

      assert.ok(result.id);
      assert.equal(result.name, 'Food');
      assert.equal(result.icon, null);
      assert.equal(result.isSystem, false);
      assert.ok(result.createdAt);
    });

    it('should insert a category with an icon', async () => {
      const result = await sut.insert({ name: 'Transport', icon: 'bus' });

      assert.equal(result.name, 'Transport');
      assert.equal(result.icon, 'bus');
    });
  });

  describe('findAll()', () => {
    it('should return an empty array when no categories exist', async () => {
      const result = await sut.findAll();

      assert.deepEqual(result, []);
    });

    it('should return all categories ordered by is_system DESC then name', async () => {
      await sut.insert({ name: 'Zeta' });
      await sut.insert({ name: 'Alpha' });
      await pool.query(
        "INSERT INTO budget_categories (name, is_system) VALUES ('System Cat', true)",
      );

      const result = await sut.findAll();

      assert.equal(result.length, 3);
      assert.equal(result[0]?.name, 'System Cat');
      assert.equal(result[1]?.name, 'Alpha');
      assert.equal(result[2]?.name, 'Zeta');
    });
  });

  describe('findById()', () => {
    it('should return the category when found', async () => {
      const category = await sut.insert({ name: 'Rent' });

      const result = await sut.findById(category.id);

      assert.ok(result);
      assert.equal(result.id, category.id);
      assert.equal(result.name, 'Rent');
    });

    it('should return null when not found', async () => {
      const result = await sut.findById('00000000-0000-0000-0000-000000000000');

      assert.equal(result, null);
    });
  });

  describe('update()', () => {
    it('should update the name', async () => {
      const category = await sut.insert({ name: 'Old Name' });

      const result = await sut.update(category.id, { name: 'New Name' });

      assert.equal(result.id, category.id);
      assert.equal(result.name, 'New Name');
    });

    it('should update the icon', async () => {
      const category = await sut.insert({ name: 'Cat', icon: 'old-icon' });

      const result = await sut.update(category.id, { icon: 'new-icon' });

      assert.equal(result.icon, 'new-icon');
      assert.equal(result.name, 'Cat');
    });

    it('should update both name and icon', async () => {
      const category = await sut.insert({ name: 'Cat' });

      const result = await sut.update(category.id, { name: 'Updated', icon: 'star' });

      assert.equal(result.name, 'Updated');
      assert.equal(result.icon, 'star');
    });
  });

  describe('delete()', () => {
    it('should delete the category', async () => {
      const category = await sut.insert({ name: 'ToDelete' });

      await sut.delete(category.id);

      const result = await sut.findById(category.id);
      assert.equal(result, null);
    });

    it('should not throw when deleting a non-existent category', async () => {
      await assert.doesNotReject(async () => sut.delete('00000000-0000-0000-0000-000000000000'));
    });
  });
});

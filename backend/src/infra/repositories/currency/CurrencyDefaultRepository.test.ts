import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import type { Pool } from 'pg';
import { createTestDb } from '../../../test/helpers/createTestDb.js';
import { CurrencyDefaultRepository } from './CurrencyDefaultRepository.js';

describe('CurrencyDefaultRepository', () => {
  let pool: Pool;
  let restore: () => void;
  let sut: CurrencyDefaultRepository;
  let customerId: string;

  before(() => {
    ({ pool, restore } = createTestDb());
    sut = new CurrencyDefaultRepository(pool);
  });

  beforeEach(async () => {
    restore();
    const result = await pool.query<{ id: string }>(
      "INSERT INTO customers (email, password_hash, name) VALUES ('currency-test@test.com', 'hashed', 'Test') RETURNING id",
    );
    customerId = result.rows[0]!.id;
  });

  describe('findByCustomerId()', () => {
    it('should return an empty array when no defaults exist', async () => {
      const result = await sut.findByCustomerId(customerId);

      assert.deepEqual(result, []);
    });

    it('should return currency defaults ordered by display_order', async () => {
      await pool.query(
        'INSERT INTO currency_defaults (customer_id, currency_code, display_order) VALUES ($1, $2, $3)',
        [customerId, 'EUR', 1],
      );
      await pool.query(
        'INSERT INTO currency_defaults (customer_id, currency_code, display_order) VALUES ($1, $2, $3)',
        [customerId, 'USD', 0],
      );

      const result = await sut.findByCustomerId(customerId);

      assert.equal(result.length, 2);
      assert.equal(result[0]!.currencyCode, 'USD');
      assert.equal(result[0]!.displayOrder, 0);
      assert.equal(result[1]!.currencyCode, 'EUR');
      assert.equal(result[1]!.displayOrder, 1);
    });

    it('should not return defaults for other customers', async () => {
      const other = await pool.query<{ id: string }>(
        "INSERT INTO customers (email, password_hash, name) VALUES ('other@test.com', 'hashed', 'Test') RETURNING id",
      );
      await pool.query(
        'INSERT INTO currency_defaults (customer_id, currency_code, display_order) VALUES ($1, $2, $3)',
        [other.rows[0]!.id, 'BRL', 0],
      );

      const result = await sut.findByCustomerId(customerId);

      assert.deepEqual(result, []);
    });
  });

  describe('replaceAll()', () => {
    it('should insert new currency defaults', async () => {
      const result = await sut.replaceAll(customerId, [
        { currencyCode: 'USD', displayOrder: 0 },
        { currencyCode: 'EUR', displayOrder: 1 },
      ]);

      assert.equal(result.length, 2);
      assert.equal(result[0]!.currencyCode, 'USD');
      assert.equal(result[0]!.displayOrder, 0);
      assert.ok(result[0]!.id);
      assert.equal(result[1]!.currencyCode, 'EUR');
      assert.equal(result[1]!.displayOrder, 1);
    });

    it('should replace existing defaults with new ones', async () => {
      await sut.replaceAll(customerId, [
        { currencyCode: 'USD', displayOrder: 0 },
        { currencyCode: 'EUR', displayOrder: 1 },
      ]);

      const result = await sut.replaceAll(customerId, [{ currencyCode: 'BRL', displayOrder: 0 }]);

      assert.equal(result.length, 1);
      assert.equal(result[0]!.currencyCode, 'BRL');

      const stored = await sut.findByCustomerId(customerId);
      assert.equal(stored.length, 1);
      assert.equal(stored[0]!.currencyCode, 'BRL');
    });

    it('should not affect other customers defaults', async () => {
      const other = await pool.query<{ id: string }>(
        "INSERT INTO customers (email, password_hash, name) VALUES ('other2@test.com', 'hashed', 'Test') RETURNING id",
      );
      const otherId = other.rows[0]!.id;
      await sut.replaceAll(otherId, [{ currencyCode: 'GBP', displayOrder: 0 }]);

      await sut.replaceAll(customerId, [{ currencyCode: 'USD', displayOrder: 0 }]);

      const otherDefaults = await sut.findByCustomerId(otherId);
      assert.equal(otherDefaults.length, 1);
      assert.equal(otherDefaults[0]!.currencyCode, 'GBP');
    });
  });
});

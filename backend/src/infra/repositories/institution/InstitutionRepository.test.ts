import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import type { Pool } from 'pg';
import { createTestDb } from '../../../test/helpers/createTestDb.js';
import { InstitutionRepository } from './InstitutionRepository.js';

describe('InstitutionRepository', () => {
  let pool: Pool;
  let restore: () => void;
  let sut: InstitutionRepository;

  before(() => {
    ({ pool, restore } = createTestDb());
    sut = new InstitutionRepository(pool);
  });

  beforeEach(() => {
    restore();
  });

  describe('findAll()', () => {
    it('should return an empty array when no institutions exist', async () => {
      const result = await sut.findAll();

      assert.deepEqual(result, []);
    });

    it('should return all institutions ordered by name', async () => {
      await pool.query(
        "INSERT INTO institutions (name, country_code, logo_url) VALUES ('Zeta Bank', 'US', 'https://logo.com/zeta.png')",
      );
      await pool.query(
        "INSERT INTO institutions (name, country_code, logo_url) VALUES ('Alpha Bank', 'BR', 'https://logo.com/alpha.png')",
      );

      const result = await sut.findAll();

      assert.equal(result.length, 2);
      assert.equal(result[0]!.name, 'Alpha Bank');
      assert.equal(result[0]!.countryCode, 'BR');
      assert.equal(result[0]!.logoUrl, 'https://logo.com/alpha.png');
      assert.equal(result[1]!.name, 'Zeta Bank');
      assert.equal(result[1]!.countryCode, 'US');
    });

    it('should handle null country_code and logo_url', async () => {
      await pool.query("INSERT INTO institutions (name) VALUES ('No Details Bank')");

      const result = await sut.findAll();

      assert.equal(result.length, 1);
      assert.equal(result[0]!.name, 'No Details Bank');
      assert.equal(result[0]!.countryCode, null);
      assert.equal(result[0]!.logoUrl, null);
    });
  });

  describe('findById()', () => {
    it('should return the institution when found', async () => {
      const inserted = await pool.query<{ id: string }>(
        "INSERT INTO institutions (name, country_code, logo_url) VALUES ('Test Bank', 'FI', 'https://logo.com/test.png') RETURNING id",
      );
      const id = inserted.rows[0]!.id;

      const result = await sut.findById(id);

      assert.ok(result);
      assert.equal(result.id, id);
      assert.equal(result.name, 'Test Bank');
      assert.equal(result.countryCode, 'FI');
      assert.equal(result.logoUrl, 'https://logo.com/test.png');
    });

    it('should return null when not found', async () => {
      const result = await sut.findById('00000000-0000-0000-0000-000000000000');

      assert.equal(result, null);
    });
  });
});

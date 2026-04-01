import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Pool } from 'pg';
import { createTestDb } from '../../../test/helpers/createTestDb.js';
import { CustomerRepository } from './CustomerRepository.js';
import { VerificationTokenRepository } from './VerificationTokenRepository.js';

describe('VerificationTokenRepository', () => {
  let pool: Pool;
  let sut: VerificationTokenRepository;
  let customerId: string;

  before(async () => {
    pool = createTestDb();
    sut = new VerificationTokenRepository(pool);

    const customerRepo = new CustomerRepository(pool);
    const customer = await customerRepo.insert({ email: 'token@test.com', passwordHash: 'hashed' });
    customerId = customer.id;
  });

  describe('insert()', () => {
    it('should insert a verification token without error', async () => {
      await assert.doesNotReject(
        async () => sut.insert(customerId, '123456', new Date(Date.now() + 60_000)),
      );
    });
  });

  describe('find()', () => {
    it('should return the token when found', async () => {
      const expiresAt = new Date(Date.now() + 60_000);
      await sut.insert(customerId, '654321', expiresAt);

      const result = await sut.find(customerId, '654321');

      assert.ok(result);
      assert.ok(result.id);
      assert.ok(result.expiresAt instanceof Date);
    });

    it('should return null when code does not match', async () => {
      const result = await sut.find(customerId, '000000');

      assert.equal(result, null);
    });

    it('should return null for a non-existent customer', async () => {
      const result = await sut.find('00000000-0000-0000-0000-000000000000', '123456');

      assert.equal(result, null);
    });
  });

  describe('delete()', () => {
    it('should delete the token', async () => {
      await sut.insert(customerId, '999999', new Date(Date.now() + 60_000));
      const token = await sut.find(customerId, '999999');
      assert.ok(token);

      await sut.delete(token.id);

      const deleted = await sut.find(customerId, '999999');
      assert.equal(deleted, null);
    });
  });
});

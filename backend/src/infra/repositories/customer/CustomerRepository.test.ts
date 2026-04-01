import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Pool } from 'pg';
import { createTestDb } from '../../../test/helpers/createTestDb.js';
import { CustomerRepository } from './CustomerRepository.js';

describe('CustomerRepository', () => {
  let pool: Pool;
  let sut: CustomerRepository;

  before(() => {
    pool = createTestDb();
    sut = new CustomerRepository(pool);
  });

  describe('insert()', () => {
    it('should insert a customer and return the created record', async () => {
      const result = await sut.insert({ email: 'insert@test.com', passwordHash: 'hashed' });

      assert.ok(result.id);
      assert.equal(result.email, 'insert@test.com');
      assert.equal(result.verifiedAt, null);
      assert.ok(result.createdAt);
    });

    it('should generate a UUID for the id', async () => {
      const result = await sut.insert({ email: 'uuid@test.com', passwordHash: 'hashed' });

      assert.match(result.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should throw on duplicate email', async () => {
      await sut.insert({ email: 'dup@test.com', passwordHash: 'hashed' });

      await assert.rejects(async () => sut.insert({ email: 'dup@test.com', passwordHash: 'hashed' }));
    });
  });

  describe('findByEmail()', () => {
    it('should return the customer when found', async () => {
      await sut.insert({ email: 'find@test.com', passwordHash: 'hashed' });

      const result = await sut.findByEmail('find@test.com');

      assert.ok(result);
      assert.equal(result.email, 'find@test.com');
      assert.equal(result.verifiedAt, null);
    });

    it('should return null when not found', async () => {
      const result = await sut.findByEmail('nonexistent@test.com');

      assert.equal(result, null);
    });
  });

  describe('findByEmailWithPassword()', () => {
    it('should return customer with passwordHash when found', async () => {
      await sut.insert({ email: 'withpw@test.com', passwordHash: 'secret-hash' });

      const result = await sut.findByEmailWithPassword('withpw@test.com');

      assert.ok(result);
      assert.equal(result.email, 'withpw@test.com');
      assert.equal(result.passwordHash, 'secret-hash');
    });

    it('should return null when not found', async () => {
      const result = await sut.findByEmailWithPassword('nope@test.com');

      assert.equal(result, null);
    });
  });

  describe('markVerified()', () => {
    it('should set verifiedAt and return the updated customer', async () => {
      const customer = await sut.insert({ email: 'verify@test.com', passwordHash: 'hashed' });
      assert.equal(customer.verifiedAt, null);

      const result = await sut.markVerified(customer.id);

      assert.equal(result.id, customer.id);
      assert.ok(result.verifiedAt);
      assert.notEqual(result.verifiedAt, null);
    });
  });
});

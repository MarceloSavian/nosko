import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import type { Pool } from 'pg';
import { createTestDb } from '../../../test/helpers/createTestDb.js';
import { CustomerRepository } from './CustomerRepository.js';

describe('CustomerRepository', () => {
  let pool: Pool;
  let restore: () => void;
  let sut: CustomerRepository;

  before(() => {
    ({ pool, restore } = createTestDb());
    sut = new CustomerRepository(pool);
  });

  beforeEach(() => {
    restore();
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

      await assert.rejects(async () =>
        sut.insert({ email: 'dup@test.com', passwordHash: 'hashed' }),
      );
    });
  });

  describe('findById()', () => {
    it('should return the customer when found', async () => {
      const customer = await sut.insert({ email: 'findid@test.com', passwordHash: 'hashed' });

      const result = await sut.findById(customer.id);

      assert.ok(result);
      assert.equal(result.id, customer.id);
      assert.equal(result.email, 'findid@test.com');
    });

    it('should return null when not found', async () => {
      const result = await sut.findById('00000000-0000-0000-0000-000000000000');

      assert.equal(result, null);
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

  describe('updatePassword()', () => {
    it('should update the password hash', async () => {
      const customer = await sut.insert({ email: 'pwupdate@test.com', passwordHash: 'old-hash' });

      await sut.updatePassword(customer.id, 'new-hash');

      const updated = await sut.findByEmailWithPassword('pwupdate@test.com');
      assert.equal(updated?.passwordHash, 'new-hash');
    });
  });

  describe('updateProfile()', () => {
    it('should update name only', async () => {
      const customer = await sut.insert({ email: 'profile1@test.com', passwordHash: 'hashed' });

      const result = await sut.updateProfile(customer.id, { name: 'Alice' });

      assert.equal(result.name, 'Alice');
      assert.equal(result.id, customer.id);
    });

    it('should update language only', async () => {
      const customer = await sut.insert({ email: 'profile2@test.com', passwordHash: 'hashed' });

      const result = await sut.updateProfile(customer.id, { language: 'fi' });

      assert.equal(result.language, 'fi');
    });

    it('should update avatarUrl only', async () => {
      const customer = await sut.insert({ email: 'profile3@test.com', passwordHash: 'hashed' });

      const result = await sut.updateProfile(customer.id, {
        avatarUrl: 'https://example.com/avatar.png',
      });

      assert.equal(result.avatarUrl, 'https://example.com/avatar.png');
    });

    it('should update all fields together', async () => {
      const customer = await sut.insert({ email: 'profile4@test.com', passwordHash: 'hashed' });

      const result = await sut.updateProfile(customer.id, {
        name: 'Bob',
        language: 'pt',
        avatarUrl: 'https://example.com/bob.png',
      });

      assert.equal(result.name, 'Bob');
      assert.equal(result.language, 'pt');
      assert.equal(result.avatarUrl, 'https://example.com/bob.png');
    });
  });

  describe('delete()', () => {
    it('should delete an existing customer', async () => {
      const customer = await sut.insert({ email: 'del@test.com', passwordHash: 'hashed' });

      await sut.delete(customer.id);

      const result = await sut.findById(customer.id);
      assert.equal(result, null);
    });
  });
});

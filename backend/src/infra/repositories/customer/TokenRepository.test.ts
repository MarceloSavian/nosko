import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import type { Pool } from 'pg';
import { TokenType } from '../../../domain/models/customer/Customer.js';
import { createTestDb } from '../../../test/helpers/createTestDb.js';
import { CustomerRepository } from './CustomerRepository.js';
import { TokenRepository } from './TokenRepository.js';

describe('TokenRepository', () => {
  let pool: Pool;
  let restore: () => void;
  let sut: TokenRepository;
  let customerId: string;

  before(() => {
    ({ pool, restore } = createTestDb());
    sut = new TokenRepository(pool);
  });

  beforeEach(async () => {
    restore();
    const customerRepo = new CustomerRepository(pool);
    const customer = await customerRepo.insert({
      email: 'token@test.com',
      passwordHash: 'hashed',
      name: 'Test',
      language: 'en-US',
    });
    customerId = customer.id;
  });

  describe('insert()', () => {
    it('should insert a token without error', async () => {
      await assert.doesNotReject(async () =>
        sut.insert(
          customerId,
          '123456',
          TokenType.EMAIL_VERIFICATION,
          new Date(Date.now() + 60_000),
        ),
      );
    });
  });

  describe('find()', () => {
    it('should return the token when found with matching type', async () => {
      const expiresAt = new Date(Date.now() + 60_000);
      await sut.insert(customerId, '654321', TokenType.EMAIL_VERIFICATION, expiresAt);

      const result = await sut.find(customerId, '654321', TokenType.EMAIL_VERIFICATION);

      assert.ok(result);
      assert.ok(result.id);
      assert.ok(result.expiresAt instanceof Date);
    });

    it('should return null when type does not match', async () => {
      await sut.insert(
        customerId,
        '111111',
        TokenType.EMAIL_VERIFICATION,
        new Date(Date.now() + 60_000),
      );

      const result = await sut.find(customerId, '111111', TokenType.PASSWORD_RESET);

      assert.equal(result, null);
    });

    it('should return null when code does not match', async () => {
      const result = await sut.find(customerId, '000000', TokenType.EMAIL_VERIFICATION);

      assert.equal(result, null);
    });

    it('should return null for a non-existent customer', async () => {
      const result = await sut.find(
        '00000000-0000-0000-0000-000000000000',
        '123456',
        TokenType.EMAIL_VERIFICATION,
      );

      assert.equal(result, null);
    });
  });

  describe('deleteByCustomerAndType()', () => {
    it('should delete all tokens of a given type for a customer', async () => {
      await sut.insert(
        customerId,
        'aaaaaa',
        TokenType.PASSWORD_RESET,
        new Date(Date.now() + 60_000),
      );
      await sut.insert(
        customerId,
        'bbbbbb',
        TokenType.PASSWORD_RESET,
        new Date(Date.now() + 60_000),
      );
      await sut.insert(
        customerId,
        'cccccc',
        TokenType.EMAIL_VERIFICATION,
        new Date(Date.now() + 60_000),
      );

      await sut.deleteByCustomerAndType(customerId, TokenType.PASSWORD_RESET);

      assert.equal(await sut.find(customerId, 'aaaaaa', TokenType.PASSWORD_RESET), null);
      assert.equal(await sut.find(customerId, 'bbbbbb', TokenType.PASSWORD_RESET), null);
      assert.ok(await sut.find(customerId, 'cccccc', TokenType.EMAIL_VERIFICATION));
    });
  });

  describe('delete()', () => {
    it('should delete the token by id', async () => {
      await sut.insert(
        customerId,
        '999999',
        TokenType.EMAIL_VERIFICATION,
        new Date(Date.now() + 60_000),
      );
      const token = await sut.find(customerId, '999999', TokenType.EMAIL_VERIFICATION);
      assert.ok(token);

      await sut.delete(token.id);

      const deleted = await sut.find(customerId, '999999', TokenType.EMAIL_VERIFICATION);
      assert.equal(deleted, null);
    });
  });
});

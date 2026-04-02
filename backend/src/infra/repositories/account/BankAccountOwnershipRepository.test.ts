import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import type { Pool } from 'pg';
import { createTestDb } from '../../../test/helpers/createTestDb.js';
import { BankAccountOwnershipRepository } from './BankAccountOwnershipRepository.js';

describe('BankAccountOwnershipRepository', () => {
  let pool: Pool;
  let restore: () => void;
  let sut: BankAccountOwnershipRepository;
  let customerAId: string;
  let customerBId: string;
  let bankAccountId: string;
  let partnershipId: string;

  before(() => {
    ({ pool, restore } = createTestDb());
    sut = new BankAccountOwnershipRepository(pool);
  });

  beforeEach(async () => {
    restore();
    const a = await pool.query<{ id: string }>(
      "INSERT INTO customers (email, password_hash) VALUES ('a@test.com', 'hashed') RETURNING id",
    );
    customerAId = a.rows[0]!.id;
    const b = await pool.query<{ id: string }>(
      "INSERT INTO customers (email, password_hash) VALUES ('b@test.com', 'hashed') RETURNING id",
    );
    customerBId = b.rows[0]!.id;
    const inst = await pool.query<{ id: string }>(
      "INSERT INTO institutions (name, country_code) VALUES ('Test Bank', 'US') RETURNING id",
    );
    const ba = await pool.query<{ id: string }>(
      "INSERT INTO bank_accounts (institution_id, account_name, currency_code) VALUES ($1, 'Checking', 'USD') RETURNING id",
      [inst.rows[0]!.id],
    );
    bankAccountId = ba.rows[0]!.id;

    const inv = await pool.query<{ id: string }>(
      "INSERT INTO partner_invitations (inviter_id, invitee_email, status) VALUES ($1, 'b@test.com', 'ACCEPTED') RETURNING id",
      [customerAId],
    );
    const p = await pool.query<{ id: string }>(
      'INSERT INTO partnerships (invitation_id, customer_a_id, customer_b_id) VALUES ($1, $2, $3) RETURNING id',
      [inv.rows[0]!.id, customerAId, customerBId],
    );
    partnershipId = p.rows[0]!.id;
  });

  describe('insert() and findAccountIdsByCustomerId()', () => {
    it('should insert ownership and find it by customer', async () => {
      await sut.insert(bankAccountId, customerAId);

      const result = await sut.findAccountIdsByCustomerId(customerAId);

      assert.deepEqual(result, [bankAccountId]);
    });

    it('should return empty array when no ownership exists', async () => {
      const result = await sut.findAccountIdsByCustomerId(customerAId);

      assert.deepEqual(result, []);
    });
  });

  describe('isOwner()', () => {
    it('should return true when ownership exists', async () => {
      await sut.insert(bankAccountId, customerAId);

      const result = await sut.isOwner(customerAId, bankAccountId);

      assert.equal(result, true);
    });

    it('should return false when ownership does not exist', async () => {
      const result = await sut.isOwner(customerAId, bankAccountId);

      assert.equal(result, false);
    });
  });

  describe('insert() with partnershipId', () => {
    it('should insert ownership with partnership reference', async () => {
      await sut.insert(bankAccountId, customerBId, partnershipId);

      const result = await sut.isOwner(customerBId, bankAccountId);

      assert.equal(result, true);
    });
  });

  describe('deleteByPartnershipAndCustomer()', () => {
    it('should delete only partnership-linked ownerships for the customer', async () => {
      await sut.insert(bankAccountId, customerAId);
      await sut.insert(bankAccountId, customerBId, partnershipId);

      await sut.deleteByPartnershipAndCustomer(partnershipId, customerBId);

      assert.equal(await sut.isOwner(customerAId, bankAccountId), true);
      assert.equal(await sut.isOwner(customerBId, bankAccountId), false);
    });

    it('should not delete ownerships without partnership reference', async () => {
      await sut.insert(bankAccountId, customerAId);

      await sut.deleteByPartnershipAndCustomer(partnershipId, customerAId);

      assert.equal(await sut.isOwner(customerAId, bankAccountId), true);
    });
  });
});

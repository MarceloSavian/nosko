import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import type { Pool } from 'pg';
import { createTestDb } from '../../../test/helpers/createTestDb.js';
import { SharedAccountRepository } from './SharedAccountRepository.js';

describe('SharedAccountRepository', () => {
  let pool: Pool;
  let restore: () => void;
  let sut: SharedAccountRepository;
  let partnershipId: string;
  let customerAId: string;
  let customerBId: string;
  let bankAccountAId: string;
  let bankAccountBId: string;

  before(() => {
    ({ pool, restore } = createTestDb());
    sut = new SharedAccountRepository(pool);
  });

  beforeEach(async () => {
    restore();
    const a = await pool.query(
      "INSERT INTO customers (email, password_hash) VALUES ('a@test.com', 'hashed') RETURNING id",
    );
    customerAId = a.rows[0].id;
    const b = await pool.query(
      "INSERT INTO customers (email, password_hash) VALUES ('b@test.com', 'hashed') RETURNING id",
    );
    customerBId = b.rows[0].id;
    const inv = await pool.query(
      "INSERT INTO partner_invitations (inviter_id, invitee_email, status) VALUES ($1, 'b@test.com', 'ACCEPTED') RETURNING id",
      [customerAId],
    );
    const p = await pool.query(
      'INSERT INTO partnerships (invitation_id, customer_a_id, customer_b_id) VALUES ($1, $2, $3) RETURNING id',
      [inv.rows[0].id, customerAId, customerBId],
    );
    partnershipId = p.rows[0].id;
    const inst = await pool.query(
      "INSERT INTO institutions (name, country_code) VALUES ('Test Bank', 'US') RETURNING id",
    );
    const institutionId = inst.rows[0].id;
    const ba1 = await pool.query(
      "INSERT INTO bank_accounts (customer_id, institution_id, account_name, currency_code) VALUES ($1, $2, 'Checking A', 'USD') RETURNING id",
      [customerAId, institutionId],
    );
    bankAccountAId = ba1.rows[0].id;
    const ba2 = await pool.query(
      "INSERT INTO bank_accounts (customer_id, institution_id, account_name, currency_code) VALUES ($1, $2, 'Checking B', 'USD') RETURNING id",
      [customerBId, institutionId],
    );
    bankAccountBId = ba2.rows[0].id;
  });

  describe('findByPartnershipId()', () => {
    it('should return empty array when no shared accounts exist', async () => {
      const results = await sut.findByPartnershipId(partnershipId);

      assert.equal(results.length, 0);
    });

    it('should return shared accounts for the partnership', async () => {
      await sut.replaceAll(partnershipId, customerAId, [bankAccountAId]);

      const results = await sut.findByPartnershipId(partnershipId);

      assert.equal(results.length, 1);
      assert.equal(results[0]!.partnershipId, partnershipId);
      assert.equal(results[0]!.bankAccountId, bankAccountAId);
      assert.equal(results[0]!.sharedByCustomerId, customerAId);
    });
  });

  describe('replaceAll()', () => {
    it('should insert shared accounts and return them', async () => {
      const results = await sut.replaceAll(partnershipId, customerAId, [bankAccountAId]);

      assert.equal(results.length, 1);
      const result = results[0]!;
      assert.ok(result.id);
      assert.equal(result.partnershipId, partnershipId);
      assert.equal(result.bankAccountId, bankAccountAId);
      assert.equal(result.sharedByCustomerId, customerAId);
      assert.ok(result.createdAt);
    });

    it('should replace previous shared accounts for the same customer', async () => {
      await sut.replaceAll(partnershipId, customerAId, [bankAccountAId]);

      const inst = await pool.query(
        "INSERT INTO institutions (name, country_code) VALUES ('Another Bank', 'US') RETURNING id",
      );
      const ba3 = await pool.query(
        "INSERT INTO bank_accounts (customer_id, institution_id, account_name, currency_code) VALUES ($1, $2, 'Savings A', 'USD') RETURNING id",
        [customerAId, inst.rows[0].id],
      );
      const newAccountId = ba3.rows[0].id;

      const results = await sut.replaceAll(partnershipId, customerAId, [newAccountId]);

      assert.equal(results.length, 1);
      assert.equal(results[0]!.bankAccountId, newAccountId);

      const all = await sut.findByPartnershipId(partnershipId);
      assert.equal(all.length, 1);
    });

    it('should not affect shared accounts from the other customer', async () => {
      await sut.replaceAll(partnershipId, customerAId, [bankAccountAId]);
      await sut.replaceAll(partnershipId, customerBId, [bankAccountBId]);

      await sut.replaceAll(partnershipId, customerAId, []);

      const all = await sut.findByPartnershipId(partnershipId);
      assert.equal(all.length, 1);
      assert.equal(all[0]!.sharedByCustomerId, customerBId);
    });

    it('should return empty array when given no bank account ids', async () => {
      const results = await sut.replaceAll(partnershipId, customerAId, []);

      assert.equal(results.length, 0);
    });

    it('should handle multiple bank accounts at once', async () => {
      const inst = await pool.query(
        "INSERT INTO institutions (name, country_code) VALUES ('Bank 2', 'US') RETURNING id",
      );
      const ba3 = await pool.query(
        "INSERT INTO bank_accounts (customer_id, institution_id, account_name, currency_code) VALUES ($1, $2, 'Savings A', 'USD') RETURNING id",
        [customerAId, inst.rows[0].id],
      );

      const results = await sut.replaceAll(partnershipId, customerAId, [
        bankAccountAId,
        ba3.rows[0].id,
      ]);

      assert.equal(results.length, 2);
    });
  });
});

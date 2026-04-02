import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import type { Pool } from 'pg';
import { createTestDb } from '../../../test/helpers/createTestDb.js';
import { PartnershipRepository } from './PartnershipRepository.js';

describe('PartnershipRepository', () => {
  let pool: Pool;
  let restore: () => void;
  let sut: PartnershipRepository;
  let customerAId: string;
  let customerBId: string;
  let invitationId: string;

  before(() => {
    ({ pool, restore } = createTestDb());
    sut = new PartnershipRepository(pool);
  });

  beforeEach(async () => {
    restore();
    const a = await pool.query(
      "INSERT INTO customers (email, password_hash, name) VALUES ('a@test.com', 'hashed', 'Test A') RETURNING id",
    );
    customerAId = a.rows[0].id;
    const b = await pool.query(
      "INSERT INTO customers (email, password_hash, name) VALUES ('b@test.com', 'hashed', 'Test B') RETURNING id",
    );
    customerBId = b.rows[0].id;
    const inv = await pool.query(
      "INSERT INTO partner_invitations (inviter_id, invitee_email, status) VALUES ($1, 'b@test.com', 'ACCEPTED') RETURNING id",
      [customerAId],
    );
    invitationId = inv.rows[0].id;
  });

  describe('insert()', () => {
    it('should insert a partnership and return the created record', async () => {
      const result = await sut.insert(invitationId, customerAId, customerBId);

      assert.ok(result.id);
      assert.equal(result.invitationId, invitationId);
      assert.equal(result.customerAId, customerAId);
      assert.equal(result.customerBId, customerBId);
      assert.ok(result.createdAt);
    });

    it('should generate a UUID for the id', async () => {
      const result = await sut.insert(invitationId, customerAId, customerBId);

      assert.match(result.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should throw on duplicate customer pair', async () => {
      await sut.insert(invitationId, customerAId, customerBId);

      const inv2 = await pool.query(
        "INSERT INTO partner_invitations (inviter_id, invitee_email, status) VALUES ($1, 'b@test.com', 'ACCEPTED') RETURNING id",
        [customerAId],
      );

      await assert.rejects(async () => sut.insert(inv2.rows[0].id, customerAId, customerBId));
    });
  });

  describe('findByCustomerId()', () => {
    it('should return partnership when customer is customer_a', async () => {
      await sut.insert(invitationId, customerAId, customerBId);

      const result = await sut.findByCustomerId(customerAId);

      assert.ok(result);
      assert.equal(result.customerAId, customerAId);
    });

    it('should return partnership when customer is customer_b', async () => {
      await sut.insert(invitationId, customerAId, customerBId);

      const result = await sut.findByCustomerId(customerBId);

      assert.ok(result);
      assert.equal(result.customerBId, customerBId);
    });

    it('should return null when no partnership exists', async () => {
      const result = await sut.findByCustomerId(customerAId);

      assert.equal(result, null);
    });
  });

  describe('findById()', () => {
    it('should return the partnership when found', async () => {
      const partnership = await sut.insert(invitationId, customerAId, customerBId);

      const result = await sut.findById(partnership.id);

      assert.ok(result);
      assert.equal(result.id, partnership.id);
      assert.equal(result.invitationId, invitationId);
    });

    it('should return null when not found', async () => {
      const result = await sut.findById('00000000-0000-0000-0000-000000000000');

      assert.equal(result, null);
    });
  });

  describe('delete()', () => {
    it('should delete the partnership', async () => {
      const partnership = await sut.insert(invitationId, customerAId, customerBId);

      await sut.delete(partnership.id);

      const result = await sut.findById(partnership.id);
      assert.equal(result, null);
    });
  });
});

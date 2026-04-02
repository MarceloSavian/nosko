import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import type { Pool } from 'pg';
import { InvitationStatus } from '../../../domain/models/partnership/Partnership.js';
import { createTestDb } from '../../../test/helpers/createTestDb.js';
import { PartnerInvitationRepository } from './PartnerInvitationRepository.js';

describe('PartnerInvitationRepository', () => {
  let pool: Pool;
  let restore: () => void;
  let sut: PartnerInvitationRepository;
  let inviterId: string;
  const inviteeEmail = 'invitee@test.com';

  before(() => {
    ({ pool, restore } = createTestDb());
    sut = new PartnerInvitationRepository(pool);
  });

  beforeEach(async () => {
    restore();
    const result = await pool.query(
      "INSERT INTO customers (email, password_hash, name) VALUES ('inviter@test.com', 'hashed', 'Inviter') RETURNING id",
    );
    inviterId = result.rows[0].id;
    await pool.query(
      "INSERT INTO customers (email, password_hash, name) VALUES ('invitee@test.com', 'hashed', 'Invitee')",
    );
  });

  describe('insert()', () => {
    it('should insert an invitation and return the created record', async () => {
      const result = await sut.insert(inviterId, inviteeEmail);

      assert.ok(result.id);
      assert.equal(result.inviterId, inviterId);
      assert.equal(result.inviteeEmail, inviteeEmail);
      assert.equal(result.status, InvitationStatus.PENDING);
      assert.equal(result.acceptedAt, null);
      assert.ok(result.createdAt);
    });

    it('should generate a UUID for the id', async () => {
      const result = await sut.insert(inviterId, inviteeEmail);

      assert.match(result.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });

  describe('findById()', () => {
    it('should return the invitation when found', async () => {
      const invitation = await sut.insert(inviterId, inviteeEmail);

      const result = await sut.findById(invitation.id);

      assert.ok(result);
      assert.equal(result.id, invitation.id);
      assert.equal(result.inviterId, inviterId);
      assert.equal(result.inviteeEmail, inviteeEmail);
    });

    it('should return null when not found', async () => {
      const result = await sut.findById('00000000-0000-0000-0000-000000000000');

      assert.equal(result, null);
    });
  });

  describe('findByCustomerId()', () => {
    it('should return invitations where customer is the inviter', async () => {
      await sut.insert(inviterId, inviteeEmail);

      const results = await sut.findByCustomerId(inviterId);

      assert.equal(results.length, 1);
      assert.equal(results[0]!.inviterId, inviterId);
    });

    it('should return invitations where customer is the invitee', async () => {
      const inviteeResult = await pool.query(
        "SELECT id FROM customers WHERE email = 'invitee@test.com'",
      );
      const inviteeId = inviteeResult.rows[0].id;
      await sut.insert(inviterId, inviteeEmail);

      const results = await sut.findByCustomerId(inviteeId);

      assert.equal(results.length, 1);
      assert.equal(results[0]!.inviteeEmail, inviteeEmail);
    });

    it('should return empty array when no invitations exist', async () => {
      const results = await sut.findByCustomerId(inviterId);

      assert.equal(results.length, 0);
    });
  });

  describe('updateStatus()', () => {
    it('should update status without acceptedAt', async () => {
      const invitation = await sut.insert(inviterId, inviteeEmail);

      const result = await sut.updateStatus(invitation.id, InvitationStatus.DECLINED);

      assert.equal(result.id, invitation.id);
      assert.equal(result.status, InvitationStatus.DECLINED);
      assert.equal(result.acceptedAt, null);
    });

    it('should update status with acceptedAt', async () => {
      const invitation = await sut.insert(inviterId, inviteeEmail);
      const now = new Date();

      const result = await sut.updateStatus(invitation.id, InvitationStatus.ACCEPTED, now);

      assert.equal(result.status, InvitationStatus.ACCEPTED);
      assert.ok(result.acceptedAt);
    });
  });

  describe('delete()', () => {
    it('should delete the invitation', async () => {
      const invitation = await sut.insert(inviterId, inviteeEmail);

      await sut.delete(invitation.id);

      const result = await sut.findById(invitation.id);
      assert.equal(result, null);
    });
  });
});

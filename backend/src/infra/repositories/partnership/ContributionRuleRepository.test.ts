import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import type { Pool } from 'pg';
import { ContributionType } from '../../../domain/models/partnership/Partnership.js';
import { createTestDb } from '../../../test/helpers/createTestDb.js';
import { ContributionRuleRepository } from './ContributionRuleRepository.js';

describe('ContributionRuleRepository', () => {
  let pool: Pool;
  let restore: () => void;
  let sut: ContributionRuleRepository;
  let partnershipId: string;

  before(() => {
    ({ pool, restore } = createTestDb());
    sut = new ContributionRuleRepository(pool);
  });

  beforeEach(async () => {
    restore();
    const a = await pool.query(
      "INSERT INTO customers (email, password_hash) VALUES ('a@test.com', 'hashed') RETURNING id",
    );
    const b = await pool.query(
      "INSERT INTO customers (email, password_hash) VALUES ('b@test.com', 'hashed') RETURNING id",
    );
    const inv = await pool.query(
      "INSERT INTO partner_invitations (inviter_id, invitee_email, status) VALUES ($1, 'b@test.com', 'ACCEPTED') RETURNING id",
      [a.rows[0].id],
    );
    const p = await pool.query(
      'INSERT INTO partnerships (invitation_id, customer_a_id, customer_b_id) VALUES ($1, $2, $3) RETURNING id',
      [inv.rows[0].id, a.rows[0].id, b.rows[0].id],
    );
    partnershipId = p.rows[0].id;
  });

  describe('findByPartnershipId()', () => {
    it('should return null when no rule exists', async () => {
      const result = await sut.findByPartnershipId(partnershipId);

      assert.equal(result, null);
    });

    it('should return the rule when it exists', async () => {
      await sut.upsert(partnershipId, ContributionType.EQUAL);

      const result = await sut.findByPartnershipId(partnershipId);

      assert.ok(result);
      assert.equal(result.partnershipId, partnershipId);
      assert.equal(result.type, ContributionType.EQUAL);
    });
  });

  describe('upsert()', () => {
    it('should insert a new rule with EQUAL type', async () => {
      const result = await sut.upsert(partnershipId, ContributionType.EQUAL);

      assert.ok(result.id);
      assert.equal(result.partnershipId, partnershipId);
      assert.equal(result.type, ContributionType.EQUAL);
      assert.equal(result.customerAPercentage, null);
      assert.equal(result.customerBPercentage, null);
      assert.ok(result.createdAt);
      assert.ok(result.updatedAt);
    });

    it('should insert a rule with CUSTOM_PERCENTAGE and percentages', async () => {
      const result = await sut.upsert(partnershipId, ContributionType.CUSTOM_PERCENTAGE, 60, 40);

      assert.equal(result.type, ContributionType.CUSTOM_PERCENTAGE);
      assert.ok(result.customerAPercentage != null);
      assert.equal(Number(result.customerAPercentage), 60);
      assert.ok(result.customerBPercentage != null);
      assert.equal(Number(result.customerBPercentage), 40);
    });

    it('should update an existing rule', async () => {
      const inserted = await sut.upsert(partnershipId, ContributionType.EQUAL);

      const updated = await sut.upsert(partnershipId, ContributionType.CUSTOM_PERCENTAGE, 70, 30);

      assert.equal(updated.partnershipId, partnershipId);
      assert.equal(updated.type, ContributionType.CUSTOM_PERCENTAGE);
      assert.ok(updated.customerAPercentage != null);
      assert.equal(Number(updated.customerAPercentage), 70);
      assert.ok(updated.customerBPercentage != null);
      assert.equal(Number(updated.customerBPercentage), 30);
      assert.equal(updated.createdAt, inserted.createdAt);
    });

    it('should insert a rule with SALARY_PROPORTIONAL type', async () => {
      const result = await sut.upsert(partnershipId, ContributionType.SALARY_PROPORTIONAL);

      assert.equal(result.type, ContributionType.SALARY_PROPORTIONAL);
      assert.equal(result.customerAPercentage, null);
      assert.equal(result.customerBPercentage, null);
    });
  });
});

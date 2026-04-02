import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import type { Pool } from 'pg';
import { createTestDb } from '../../../test/helpers/createTestDb.js';
import { BudgetPlanRepository } from './BudgetPlanRepository.js';

describe('BudgetPlanRepository', () => {
  let pool: Pool;
  let restore: () => void;
  let sut: BudgetPlanRepository;

  const CUSTOMER_ID = '11111111-1111-1111-1111-111111111111';
  const CUSTOMER_B_ID = '22222222-2222-2222-2222-222222222222';
  const INVITATION_ID = '33333333-3333-3333-3333-333333333333';
  const PARTNERSHIP_ID = '44444444-4444-4444-4444-444444444444';

  before(() => {
    ({ pool, restore } = createTestDb());
    sut = new BudgetPlanRepository(pool);
  });

  beforeEach(() => {
    restore();
  });

  async function insertCustomer(id: string = CUSTOMER_ID): Promise<void> {
    await pool.query(
      "INSERT INTO customers (id, email, password_hash, name) VALUES ($1, $2, 'hashed', 'Test')",
      [id, `user-${id}@test.com`],
    );
  }

  async function insertPartnership(): Promise<void> {
    await insertCustomer(CUSTOMER_ID);
    await insertCustomer(CUSTOMER_B_ID);
    await pool.query(
      "INSERT INTO partner_invitations (id, inviter_id, invitee_email, status) VALUES ($1, $2, $3, 'ACCEPTED')",
      [INVITATION_ID, CUSTOMER_ID, `user-${CUSTOMER_B_ID}@test.com`],
    );
    await pool.query(
      'INSERT INTO partnerships (id, invitation_id, customer_a_id, customer_b_id) VALUES ($1, $2, $3, $4)',
      [PARTNERSHIP_ID, INVITATION_ID, CUSTOMER_ID, CUSTOMER_B_ID],
    );
  }

  describe('insertPersonal()', () => {
    it('should insert a personal plan and return the created record', async () => {
      await insertCustomer();

      const result = await sut.insertPersonal(CUSTOMER_ID, '2026-04', 'EUR');

      assert.ok(result.id);
      assert.equal(result.customerId, CUSTOMER_ID);
      assert.equal(result.partnershipId, null);
      assert.equal(result.yearMonth, '2026-04');
      assert.equal(result.currencyCode, 'EUR');
      assert.equal(result.isJoint, false);
      assert.ok(result.createdAt);
      assert.ok(result.updatedAt);
    });
  });

  describe('insertJoint()', () => {
    it('should insert a joint plan and return the created record', async () => {
      await insertPartnership();

      const result = await sut.insertJoint(PARTNERSHIP_ID, '2026-04', 'BRL');

      assert.ok(result.id);
      assert.equal(result.customerId, null);
      assert.equal(result.partnershipId, PARTNERSHIP_ID);
      assert.equal(result.yearMonth, '2026-04');
      assert.equal(result.currencyCode, 'BRL');
      assert.equal(result.isJoint, true);
    });
  });

  describe('findById()', () => {
    it('should return the plan when found', async () => {
      await insertCustomer();
      const plan = await sut.insertPersonal(CUSTOMER_ID, '2026-04', 'EUR');

      const result = await sut.findById(plan.id);

      assert.ok(result);
      assert.equal(result.id, plan.id);
      assert.equal(result.customerId, CUSTOMER_ID);
    });

    it('should return null when not found', async () => {
      const result = await sut.findById('00000000-0000-0000-0000-000000000000');

      assert.equal(result, null);
    });
  });

  describe('findByCustomerAndMonth()', () => {
    it('should return the personal plan for the given customer and month', async () => {
      await insertCustomer();
      const plan = await sut.insertPersonal(CUSTOMER_ID, '2026-04', 'EUR');

      const result = await sut.findByCustomerAndMonth(CUSTOMER_ID, '2026-04');

      assert.ok(result);
      assert.equal(result.id, plan.id);
      assert.equal(result.isJoint, false);
    });

    it('should return null when no plan exists for that month', async () => {
      await insertCustomer();

      const result = await sut.findByCustomerAndMonth(CUSTOMER_ID, '2026-05');

      assert.equal(result, null);
    });

    it('should not return joint plans', async () => {
      await insertPartnership();
      await sut.insertJoint(PARTNERSHIP_ID, '2026-04', 'EUR');

      const result = await sut.findByCustomerAndMonth(CUSTOMER_ID, '2026-04');

      assert.equal(result, null);
    });
  });

  describe('findByPartnershipAndMonth()', () => {
    it('should return the joint plan for the given partnership and month', async () => {
      await insertPartnership();
      const plan = await sut.insertJoint(PARTNERSHIP_ID, '2026-04', 'BRL');

      const result = await sut.findByPartnershipAndMonth(PARTNERSHIP_ID, '2026-04');

      assert.ok(result);
      assert.equal(result.id, plan.id);
      assert.equal(result.isJoint, true);
    });

    it('should return null when no joint plan exists for that month', async () => {
      await insertPartnership();

      const result = await sut.findByPartnershipAndMonth(PARTNERSHIP_ID, '2026-06');

      assert.equal(result, null);
    });
  });

  describe('delete()', () => {
    it('should delete the plan', async () => {
      await insertCustomer();
      const plan = await sut.insertPersonal(CUSTOMER_ID, '2026-04', 'EUR');

      await sut.delete(plan.id);

      const result = await sut.findById(plan.id);
      assert.equal(result, null);
    });

    it('should not throw when deleting a non-existent plan', async () => {
      await assert.doesNotReject(async () => sut.delete('00000000-0000-0000-0000-000000000000'));
    });
  });
});

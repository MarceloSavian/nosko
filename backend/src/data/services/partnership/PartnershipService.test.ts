import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import {
  AlreadyHasPartnerError,
  CannotInviteSelfError,
  InvitationNotFoundError,
  PartnershipNotFoundError,
} from '../../../domain/errors/partnership.js';
import { resetMock } from '../../../test/helpers/resetMock.js';
import { mockContributionRuleRepository } from '../../../test/mocks/MockContributionRuleRepository.js';
import { mockCustomerRepository } from '../../../test/mocks/MockCustomerRepository.js';
import { mockPartnerInvitationRepository } from '../../../test/mocks/MockPartnerInvitationRepository.js';
import { mockPartnershipRepository } from '../../../test/mocks/MockPartnershipRepository.js';
import { mockSharedAccountRepository } from '../../../test/mocks/MockSharedAccountRepository.js';
import { PartnershipService } from './PartnershipService.js';

describe('PartnershipService', () => {
  const makeSut = () => {
    const sut = new PartnershipService(
      mockCustomerRepository,
      mockPartnerInvitationRepository,
      mockPartnershipRepository,
      mockContributionRuleRepository,
      mockSharedAccountRepository,
    );
    return { sut };
  };

  const customer = {
    id: 'customer-id',
    email: 'alex@test.com',
    name: 'Alex',
    language: 'en',
    avatarUrl: null,
    verifiedAt: '2024-01-01T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  const invitation = {
    id: 'invitation-id',
    inviterId: 'customer-id',
    inviteeEmail: 'partner@test.com',
    status: 'PENDING',
    acceptedAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  const partnership = {
    id: 'partnership-id',
    invitationId: 'invitation-id',
    customerAId: 'customer-id',
    customerBId: 'partner-id',
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    resetMock(mockCustomerRepository);
    resetMock(mockPartnerInvitationRepository);
    resetMock(mockPartnershipRepository);
    resetMock(mockContributionRuleRepository);
    resetMock(mockSharedAccountRepository);
  });

  describe('invitePartner()', () => {
    it('should create an invitation', async () => {
      const { sut } = makeSut();
      mockCustomerRepository.findById.mock.mockImplementationOnce(async () => customer);
      mockPartnershipRepository.findByCustomerId.mock.mockImplementationOnce(async () => null);
      mockPartnerInvitationRepository.insert.mock.mockImplementationOnce(async () => invitation);

      const result = await sut.invitePartner('customer-id', { email: 'partner@test.com' });

      assert.deepEqual(result, invitation);
    });

    it('should throw CannotInviteSelfError when inviting own email', async () => {
      const { sut } = makeSut();
      mockCustomerRepository.findById.mock.mockImplementationOnce(async () => customer);

      await assert.rejects(
        async () => sut.invitePartner('customer-id', { email: 'alex@test.com' }),
        new CannotInviteSelfError(),
      );
    });

    it('should throw AlreadyHasPartnerError when already partnered', async () => {
      const { sut } = makeSut();
      mockCustomerRepository.findById.mock.mockImplementationOnce(async () => customer);
      mockPartnershipRepository.findByCustomerId.mock.mockImplementationOnce(
        async () => partnership,
      );

      await assert.rejects(
        async () => sut.invitePartner('customer-id', { email: 'new@test.com' }),
        new AlreadyHasPartnerError(),
      );
    });
  });

  describe('acceptInvitation()', () => {
    it('should throw InvitationNotFoundError when not found', async () => {
      const { sut } = makeSut();
      mockPartnerInvitationRepository.findById.mock.mockImplementationOnce(async () => null);

      await assert.rejects(
        async () => sut.acceptInvitation('partner-id', 'nonexistent'),
        new InvitationNotFoundError(),
      );
    });
  });

  describe('getPartnership()', () => {
    it('should return the partnership', async () => {
      const { sut } = makeSut();
      mockPartnershipRepository.findByCustomerId.mock.mockImplementationOnce(
        async () => partnership,
      );

      const result = await sut.getPartnership('customer-id');

      assert.deepEqual(result, partnership);
    });

    it('should throw PartnershipNotFoundError when no partnership', async () => {
      const { sut } = makeSut();
      mockPartnershipRepository.findByCustomerId.mock.mockImplementationOnce(async () => null);

      await assert.rejects(
        async () => sut.getPartnership('customer-id'),
        new PartnershipNotFoundError(),
      );
    });
  });

  describe('dissolvePartnership()', () => {
    it('should delete the partnership', async () => {
      const { sut } = makeSut();
      mockPartnershipRepository.findByCustomerId.mock.mockImplementationOnce(
        async () => partnership,
      );

      await sut.dissolvePartnership('customer-id');

      assert.equal(mockPartnershipRepository.delete.mock.calls[0]?.arguments[0], 'partnership-id');
    });
  });

  describe('setContributionRules()', () => {
    it('should upsert contribution rules', async () => {
      const { sut } = makeSut();
      mockPartnershipRepository.findByCustomerId.mock.mockImplementationOnce(
        async () => partnership,
      );
      const rule = {
        id: 'rule-id',
        partnershipId: 'partnership-id',
        type: 'EQUAL',
        customerAPercentage: null,
        customerBPercentage: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      mockContributionRuleRepository.upsert.mock.mockImplementationOnce(async () => rule);

      const result = await sut.setContributionRules('customer-id', { type: 'EQUAL' });

      assert.deepEqual(result, rule);
    });
  });
});

import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import {
  AlreadyHasPartnerError,
  CannotInviteSelfError,
  InvitationNotFoundError,
  InvitationNotPendingError,
  InviteeNotRegisteredError,
  NotPartnershipMemberError,
  PartnershipNotFoundError,
  SharedAccountNotOwnedError,
} from '../../../domain/errors/partnership.js';
import {
  ContributionType,
  InvitationStatus,
} from '../../../domain/models/partnership/Partnership.js';
import { resetMock } from '../../../test/helpers/resetMock.js';
import { mockOwnershipRepository } from '../../../test/mocks/MockBankAccountOwnershipRepository.js';
import { mockBankAccountRepository } from '../../../test/mocks/MockBankAccountRepository.js';
import { mockContributionRuleRepository } from '../../../test/mocks/MockContributionRuleRepository.js';
import { mockCustomerRepository } from '../../../test/mocks/MockCustomerRepository.js';
import { mockEmailService } from '../../../test/mocks/MockEmailService.js';
import { mockPartnerInvitationRepository } from '../../../test/mocks/MockPartnerInvitationRepository.js';
import { mockPartnershipRepository } from '../../../test/mocks/MockPartnershipRepository.js';
import { PartnershipService } from './PartnershipService.js';

describe('PartnershipService', () => {
  const makeSut = () => {
    const sut = new PartnershipService(
      mockCustomerRepository,
      mockPartnerInvitationRepository,
      mockPartnershipRepository,
      mockContributionRuleRepository,
      mockOwnershipRepository,
      mockEmailService,
      mockBankAccountRepository,
    );
    return { sut };
  };

  const customer = {
    id: 'customer-id',
    email: 'alex@test.com',
    name: 'Alex',
    language: 'en-US',
    avatarUrl: null,
    verifiedAt: '2024-01-01T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  const invitee = {
    id: 'invitee-id',
    email: 'partner@test.com',
    name: 'Partner',
    language: 'en-US',
    avatarUrl: null,
    verifiedAt: '2024-01-01T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  const invitation = {
    id: 'invitation-id',
    inviterId: 'customer-id',
    inviteeEmail: 'partner@test.com',
    status: InvitationStatus.PENDING,
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
    mock.restoreAll();
    resetMock(mockCustomerRepository);
    resetMock(mockPartnerInvitationRepository);
    resetMock(mockPartnershipRepository);
    resetMock(mockContributionRuleRepository);
    resetMock(mockOwnershipRepository);
    resetMock(mockEmailService);
    resetMock(mockBankAccountRepository);
  });

  describe('invitePartner()', () => {
    it('should create an invitation and send email', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findById', async () => customer);
      mock.method(mockCustomerRepository, 'findByEmail', async () => invitee);
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => null);
      mock.method(mockPartnerInvitationRepository, 'insert', async () => invitation);

      const result = await sut.invitePartner('customer-id', { email: 'partner@test.com' });

      assert.deepEqual(result, invitation);
      assert.equal(mockEmailService.send.mock.calls.length, 1);
      assert.equal(mockEmailService.send.mock.calls[0]?.arguments[0], 'partner@test.com');
    });

    it('should throw CannotInviteSelfError when inviting own email', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findById', async () => customer);

      await assert.rejects(
        async () => sut.invitePartner('customer-id', { email: 'alex@test.com' }),
        new CannotInviteSelfError(),
      );
    });

    it('should throw InviteeNotRegisteredError when invitee not found', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findById', async () => customer);
      mock.method(mockCustomerRepository, 'findByEmail', async () => null);

      await assert.rejects(
        async () => sut.invitePartner('customer-id', { email: 'unknown@test.com' }),
        new InviteeNotRegisteredError(),
      );
    });

    it('should throw AlreadyHasPartnerError when already partnered', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findById', async () => customer);
      mock.method(mockCustomerRepository, 'findByEmail', async () => invitee);
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => partnership);

      await assert.rejects(
        async () => sut.invitePartner('customer-id', { email: 'partner@test.com' }),
        new AlreadyHasPartnerError(),
      );
    });
  });

  describe('listInvitations()', () => {
    it('should return invitations for the customer', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnerInvitationRepository, 'findByCustomerId', async () => [invitation]);

      const result = await sut.listInvitations('customer-id');

      assert.deepEqual(result, [invitation]);
      assert.equal(
        mockPartnerInvitationRepository.findByCustomerId.mock.calls[0]?.arguments[0],
        'customer-id',
      );
    });
  });

  describe('acceptInvitation()', () => {
    it('should accept invitation and create partnership', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnerInvitationRepository, 'findById', async () => invitation);
      mock.method(mockCustomerRepository, 'findById', async () => invitee);
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => null);
      mock.method(mockPartnerInvitationRepository, 'updateStatus', async () => ({
        ...invitation,
        status: InvitationStatus.ACCEPTED,
      }));
      mock.method(mockPartnershipRepository, 'insert', async () => partnership);

      const result = await sut.acceptInvitation('invitee-id', 'invitation-id');

      assert.deepEqual(result, partnership);
      assert.equal(mockPartnerInvitationRepository.updateStatus.mock.calls.length, 1);
      assert.equal(mockPartnershipRepository.insert.mock.calls.length, 1);
    });

    it('should throw InvitationNotFoundError when not found', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnerInvitationRepository, 'findById', async () => null);

      await assert.rejects(
        async () => sut.acceptInvitation('partner-id', 'nonexistent'),
        new InvitationNotFoundError(),
      );
    });

    it('should throw InvitationNotPendingError when invitation is not pending', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnerInvitationRepository, 'findById', async () => ({
        ...invitation,
        status: InvitationStatus.ACCEPTED,
      }));

      await assert.rejects(
        async () => sut.acceptInvitation('invitee-id', 'invitation-id'),
        new InvitationNotPendingError(),
      );
    });

    it('should throw InvitationNotFoundError when customer email does not match invitee', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnerInvitationRepository, 'findById', async () => invitation);
      mock.method(mockCustomerRepository, 'findById', async () => ({
        ...invitee,
        email: 'wrong@test.com',
      }));

      await assert.rejects(
        async () => sut.acceptInvitation('invitee-id', 'invitation-id'),
        new InvitationNotFoundError(),
      );
    });

    it('should throw AlreadyHasPartnerError when invitee already has a partner', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnerInvitationRepository, 'findById', async () => invitation);
      mock.method(mockCustomerRepository, 'findById', async () => invitee);
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => partnership);

      await assert.rejects(
        async () => sut.acceptInvitation('invitee-id', 'invitation-id'),
        new AlreadyHasPartnerError(),
      );
    });
  });

  describe('declineInvitation()', () => {
    it('should decline a pending invitation', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnerInvitationRepository, 'findById', async () => invitation);
      mock.method(mockCustomerRepository, 'findById', async () => invitee);

      await sut.declineInvitation('invitee-id', 'invitation-id');

      assert.equal(mockPartnerInvitationRepository.updateStatus.mock.calls.length, 1);
      const args = mockPartnerInvitationRepository.updateStatus.mock.calls[0]?.arguments;
      assert.equal(args?.[0], 'invitation-id');
      assert.equal(args?.[1], InvitationStatus.DECLINED);
    });

    it('should throw InvitationNotFoundError when not found', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnerInvitationRepository, 'findById', async () => null);

      await assert.rejects(
        async () => sut.declineInvitation('invitee-id', 'nonexistent'),
        new InvitationNotFoundError(),
      );
    });

    it('should throw InvitationNotPendingError when not pending', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnerInvitationRepository, 'findById', async () => ({
        ...invitation,
        status: InvitationStatus.DECLINED,
      }));

      await assert.rejects(
        async () => sut.declineInvitation('invitee-id', 'invitation-id'),
        new InvitationNotPendingError(),
      );
    });

    it('should throw InvitationNotFoundError when customer email does not match', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnerInvitationRepository, 'findById', async () => invitation);
      mock.method(mockCustomerRepository, 'findById', async () => ({
        ...invitee,
        email: 'wrong@test.com',
      }));

      await assert.rejects(
        async () => sut.declineInvitation('invitee-id', 'invitation-id'),
        new InvitationNotFoundError(),
      );
    });
  });

  describe('cancelInvitation()', () => {
    it('should cancel a pending invitation owned by the customer', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnerInvitationRepository, 'findById', async () => invitation);

      await sut.cancelInvitation('customer-id', 'invitation-id');

      assert.equal(mockPartnerInvitationRepository.delete.mock.calls.length, 1);
      assert.equal(
        mockPartnerInvitationRepository.delete.mock.calls[0]?.arguments[0],
        'invitation-id',
      );
    });

    it('should throw InvitationNotFoundError when not found', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnerInvitationRepository, 'findById', async () => null);

      await assert.rejects(
        async () => sut.cancelInvitation('customer-id', 'nonexistent'),
        new InvitationNotFoundError(),
      );
    });

    it('should throw InvitationNotFoundError when customer is not the inviter', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnerInvitationRepository, 'findById', async () => invitation);

      await assert.rejects(
        async () => sut.cancelInvitation('other-customer', 'invitation-id'),
        new InvitationNotFoundError(),
      );
    });

    it('should throw InvitationNotPendingError when invitation is not pending', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnerInvitationRepository, 'findById', async () => ({
        ...invitation,
        status: InvitationStatus.ACCEPTED,
      }));

      await assert.rejects(
        async () => sut.cancelInvitation('customer-id', 'invitation-id'),
        new InvitationNotPendingError(),
      );
    });
  });

  describe('getPartnership()', () => {
    it('should return the partnership', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => partnership);

      const result = await sut.getPartnership('customer-id');

      assert.deepEqual(result, partnership);
    });

    it('should throw PartnershipNotFoundError when no partnership', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => null);

      await assert.rejects(
        async () => sut.getPartnership('customer-id'),
        new PartnershipNotFoundError(),
      );
    });
  });

  describe('dissolvePartnership()', () => {
    it('should delete the partnership', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => partnership);

      await sut.dissolvePartnership('customer-id');

      assert.equal(mockPartnershipRepository.delete.mock.calls[0]?.arguments[0], 'partnership-id');
    });
  });

  describe('getContributionRules()', () => {
    it('should return contribution rules for partnership', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => partnership);
      const rule = {
        id: 'rule-id',
        partnershipId: 'partnership-id',
        type: ContributionType.EQUAL,
        customerAPercentage: null,
        customerBPercentage: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      mock.method(mockContributionRuleRepository, 'findByPartnershipId', async () => rule);

      const result = await sut.getContributionRules('customer-id');

      assert.deepEqual(result, rule);
    });

    it('should return null when no rules exist', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => partnership);
      mock.method(mockContributionRuleRepository, 'findByPartnershipId', async () => null);

      const result = await sut.getContributionRules('customer-id');

      assert.equal(result, null);
    });

    it('should throw PartnershipNotFoundError when no partnership', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => null);

      await assert.rejects(
        async () => sut.getContributionRules('customer-id'),
        new PartnershipNotFoundError(),
      );
    });
  });

  describe('getSharedAccounts()', () => {
    it('should return partner accounts', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => partnership);
      mock.method(mockOwnershipRepository, 'findAccountIdsByCustomerId', async () => ['acc-1']);
      const account = {
        id: 'acc-1',
        institutionId: 'inst-id',
        accountName: 'Checking',
        currencyCode: 'USD',
        balance: 0,
        accountType: 'CHECKING',
        balanceUpdatedAt: null,
        createdAt: '',
      };
      mock.method(mockBankAccountRepository, 'findByIds', async () => [account]);

      const result = await sut.getSharedAccounts('customer-id');

      assert.deepEqual(result, [account]);
      const partnerIdArg =
        mockOwnershipRepository.findAccountIdsByCustomerId.mock.calls[0]?.arguments[0];
      assert.equal(partnerIdArg, 'partner-id');
    });

    it('should return empty array when partner has no accounts', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => partnership);
      mock.method(mockOwnershipRepository, 'findAccountIdsByCustomerId', async () => []);

      const result = await sut.getSharedAccounts('customer-id');

      assert.deepEqual(result, []);
      assert.equal(mockBankAccountRepository.findByIds.mock.callCount(), 0);
    });

    it('should throw PartnershipNotFoundError when no partnership', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => null);

      await assert.rejects(
        async () => sut.getSharedAccounts('customer-id'),
        new PartnershipNotFoundError(),
      );
    });

    it('should throw NotPartnershipMemberError when customer is not a member', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => ({
        ...partnership,
        customerAId: 'other-a',
        customerBId: 'other-b',
      }));

      await assert.rejects(
        async () => sut.getSharedAccounts('customer-id'),
        new NotPartnershipMemberError(),
      );
    });
  });

  describe('setSharedAccounts()', () => {
    it('should create ownership for partner and return accounts', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => partnership);
      mock.method(mockOwnershipRepository, 'isOwner', async () => true);
      const sharedAccount = {
        id: 'bank-acc-1',
        institutionId: 'inst-id',
        accountName: 'Checking',
        currencyCode: 'USD',
        balance: 0,
        accountType: 'CHECKING',
        balanceUpdatedAt: null,
        createdAt: '',
      };
      mock.method(mockBankAccountRepository, 'findByIds', async () => [sharedAccount]);

      const result = await sut.setSharedAccounts('customer-id', {
        bankAccountIds: ['bank-acc-1'],
      });

      assert.deepEqual(result, [sharedAccount]);
      assert.equal(mockOwnershipRepository.deleteByPartnershipAndCustomer.mock.calls.length, 1);
      assert.equal(mockOwnershipRepository.insert.mock.calls.length, 1);
      const insertArgs = mockOwnershipRepository.insert.mock.calls[0]?.arguments;
      assert.equal(insertArgs?.[0], 'bank-acc-1');
      assert.equal(insertArgs?.[1], 'partner-id');
      assert.equal(insertArgs?.[2], 'partnership-id');
    });

    it('should return empty array when unsetting all shared accounts', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => partnership);

      const result = await sut.setSharedAccounts('customer-id', { bankAccountIds: [] });

      assert.deepEqual(result, []);
      assert.equal(mockOwnershipRepository.deleteByPartnershipAndCustomer.mock.callCount(), 1);
      assert.equal(mockOwnershipRepository.insert.mock.callCount(), 0);
    });

    it('should throw SharedAccountNotOwnedError when account not owned by customer', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => partnership);
      mock.method(mockOwnershipRepository, 'isOwner', async () => false);

      await assert.rejects(
        async () => sut.setSharedAccounts('customer-id', { bankAccountIds: ['bank-acc-1'] }),
        new SharedAccountNotOwnedError(),
      );
    });

    it('should throw PartnershipNotFoundError when no partnership', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => null);

      await assert.rejects(
        async () => sut.setSharedAccounts('customer-id', { bankAccountIds: ['acc-1'] }),
        new PartnershipNotFoundError(),
      );
    });
  });

  describe('setContributionRules()', () => {
    it('should upsert contribution rules', async () => {
      const { sut } = makeSut();
      mock.method(mockPartnershipRepository, 'findByCustomerId', async () => partnership);
      const rule = {
        id: 'rule-id',
        partnershipId: 'partnership-id',
        type: ContributionType.EQUAL,
        customerAPercentage: null,
        customerBPercentage: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      mock.method(mockContributionRuleRepository, 'upsert', async () => rule);

      const result = await sut.setContributionRules('customer-id', {
        type: ContributionType.EQUAL,
      });

      assert.deepEqual(result, rule);
    });
  });
});

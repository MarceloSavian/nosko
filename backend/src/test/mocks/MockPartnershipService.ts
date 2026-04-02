import { mock } from 'node:test';
import type { BankAccountSchema } from '../../domain/models/account/Account.js';
import {
  type ContributionRuleSchema,
  ContributionType,
  InvitationStatus,
  type InvitePartnerInput,
  type PartnerInvitationSchema,
  type PartnershipSchema,
  type SetContributionRuleInput,
  type SetSharedAccountsInput,
} from '../../domain/models/partnership/Partnership.js';
import type { IPartnershipService } from '../../domain/usecases/partnership/IPartnershipService.js';

const defaultInvitation: PartnerInvitationSchema = {
  id: '',
  inviterId: '',
  inviteeEmail: '',
  status: InvitationStatus.PENDING,
  acceptedAt: null,
  createdAt: '',
};

const defaultPartnership: PartnershipSchema = {
  id: '',
  invitationId: '',
  customerAId: '',
  customerBId: '',
  createdAt: '',
};

class MockPartnershipService implements IPartnershipService {
  invitePartner = mock.fn(
    async (_customerId: string, _input: InvitePartnerInput): Promise<PartnerInvitationSchema> => ({
      ...defaultInvitation,
    }),
  );
  listInvitations = mock.fn(async (_customerId: string): Promise<PartnerInvitationSchema[]> => []);
  acceptInvitation = mock.fn(
    async (_customerId: string, _invitationId: string): Promise<PartnershipSchema> => ({
      ...defaultPartnership,
    }),
  );
  declineInvitation = mock.fn(
    async (_customerId: string, _invitationId: string): Promise<void> => {},
  );
  cancelInvitation = mock.fn(
    async (_customerId: string, _invitationId: string): Promise<void> => {},
  );
  getPartnership = mock.fn(
    async (_customerId: string): Promise<PartnershipSchema> => ({ ...defaultPartnership }),
  );
  dissolvePartnership = mock.fn(async (_customerId: string): Promise<void> => {});
  getContributionRules = mock.fn(
    async (_customerId: string): Promise<ContributionRuleSchema | null> => null,
  );
  setContributionRules = mock.fn(
    async (
      _customerId: string,
      _input: SetContributionRuleInput,
    ): Promise<ContributionRuleSchema> => ({
      id: '',
      partnershipId: '',
      type: ContributionType.EQUAL,
      customerAPercentage: null,
      customerBPercentage: null,
      createdAt: '',
      updatedAt: '',
    }),
  );
  getSharedAccounts = mock.fn(async (_customerId: string): Promise<BankAccountSchema[]> => []);
  setSharedAccounts = mock.fn(
    async (_customerId: string, _input: SetSharedAccountsInput): Promise<BankAccountSchema[]> => [],
  );
}

export const mockPartnershipService = new MockPartnershipService();

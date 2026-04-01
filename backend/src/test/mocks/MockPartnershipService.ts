import { mock } from 'node:test';
import type {
  ContributionRuleSchema,
  InvitePartnerInput,
  PartnerInvitationSchema,
  PartnershipSchema,
  SetContributionRuleInput,
  SetSharedAccountsInput,
  SharedAccountSchema,
} from '../../domain/models/partnership/Partnership.js';
import type { IPartnershipService } from '../../domain/usecases/partnership/IPartnershipService.js';

const defaultInvitation: PartnerInvitationSchema = {
  id: '',
  inviterId: '',
  inviteeEmail: '',
  status: 'PENDING',
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
      type: 'EQUAL',
      customerAPercentage: null,
      customerBPercentage: null,
      createdAt: '',
      updatedAt: '',
    }),
  );
  getSharedAccounts = mock.fn(async (_customerId: string): Promise<SharedAccountSchema[]> => []);
  setSharedAccounts = mock.fn(
    async (
      _customerId: string,
      _input: SetSharedAccountsInput,
    ): Promise<SharedAccountSchema[]> => [],
  );
}

export const mockPartnershipService = new MockPartnershipService();

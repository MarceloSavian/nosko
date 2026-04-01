import { mock } from 'node:test';
import type { IPartnerInvitationRepository } from '../../data/domain/partnership/IPartnerInvitationRepository.js';
import type { PartnerInvitationSchema } from '../../domain/models/partnership/Partnership.js';

const defaultInvitation: PartnerInvitationSchema = {
  id: '',
  inviterId: '',
  inviteeEmail: '',
  status: 'PENDING',
  acceptedAt: null,
  createdAt: '',
};

class MockPartnerInvitationRepository implements IPartnerInvitationRepository {
  insert = mock.fn(
    async (_inviterId: string, _inviteeEmail: string): Promise<PartnerInvitationSchema> => ({
      ...defaultInvitation,
    }),
  );
  findById = mock.fn(async (_id: string): Promise<PartnerInvitationSchema | null> => null);
  findByCustomerId = mock.fn(async (_customerId: string): Promise<PartnerInvitationSchema[]> => []);
  updateStatus = mock.fn(
    async (_id: string, _status: string, _acceptedAt?: Date): Promise<PartnerInvitationSchema> => ({
      ...defaultInvitation,
    }),
  );
  delete = mock.fn(async (_id: string): Promise<void> => {});
}

export const mockPartnerInvitationRepository = new MockPartnerInvitationRepository();

import { mock } from 'node:test';
import type { IPartnershipRepository } from '../../data/domain/partnership/IPartnershipRepository.js';
import type { PartnershipSchema } from '../../domain/models/partnership/Partnership.js';

const defaultPartnership: PartnershipSchema = {
  id: '',
  invitationId: '',
  customerAId: '',
  customerBId: '',
  createdAt: '',
};

class MockPartnershipRepository implements IPartnershipRepository {
  insert = mock.fn(
    async (
      _invitationId: string,
      _customerAId: string,
      _customerBId: string,
    ): Promise<PartnershipSchema> => ({ ...defaultPartnership }),
  );
  findByCustomerId = mock.fn(
    async (_customerId: string): Promise<PartnershipSchema | null> => null,
  );
  findById = mock.fn(async (_id: string): Promise<PartnershipSchema | null> => null);
  delete = mock.fn(async (_id: string): Promise<void> => {});
}

export const mockPartnershipRepository = new MockPartnershipRepository();

import { mock } from 'node:test';
import type { ISharedAccountRepository } from '../../data/domain/partnership/ISharedAccountRepository.js';
import type { SharedAccountSchema } from '../../domain/models/partnership/Partnership.js';

class MockSharedAccountRepository implements ISharedAccountRepository {
  findByPartnershipId = mock.fn(
    async (_partnershipId: string): Promise<SharedAccountSchema[]> => [],
  );
  replaceAll = mock.fn(
    async (
      _partnershipId: string,
      _sharedByCustomerId: string,
      _bankAccountIds: string[],
    ): Promise<SharedAccountSchema[]> => [],
  );
}

export const mockSharedAccountRepository = new MockSharedAccountRepository();

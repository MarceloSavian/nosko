import { mock } from 'node:test';
import type { IBankAccountOwnershipRepository } from '../../data/domain/account/IBankAccountOwnershipRepository.js';

class MockBankAccountOwnershipRepository implements IBankAccountOwnershipRepository {
  findAccountIdsByCustomerId = mock.fn(async (_customerId: string): Promise<string[]> => []);
  isOwner = mock.fn(async (_customerId: string, _bankAccountId: string): Promise<boolean> => false);
  insert = mock.fn(
    async (
      _bankAccountId: string,
      _customerId: string,
      _partnershipId?: string,
    ): Promise<void> => {},
  );
  deleteByPartnershipAndCustomer = mock.fn(
    async (_partnershipId: string, _customerId: string): Promise<void> => {},
  );
}

export const mockOwnershipRepository = new MockBankAccountOwnershipRepository();

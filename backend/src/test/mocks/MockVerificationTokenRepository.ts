import { mock } from 'node:test';
import type { IVerificationTokenRepository } from '../../data/domain/customer/IVerificationTokenRepository.js';

class MockVerificationTokenRepository implements IVerificationTokenRepository {
  insert = mock.fn(async (_customerId: string, _code: string, _expiresAt: Date): Promise<void> => {});
  find = mock.fn(
    async (_customerId: string, _code: string): Promise<{ id: string; expiresAt: Date } | null> => null,
  );
  delete = mock.fn(async (_id: string): Promise<void> => {});
}

export const mockVerificationTokenRepository = new MockVerificationTokenRepository();

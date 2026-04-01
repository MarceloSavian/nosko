import { mock } from 'node:test';
import type { TokenType } from '../../domain/models/customer/Customer.js';
import type { ITokenRepository } from '../../data/domain/customer/ITokenRepository.js';

class MockTokenRepository implements ITokenRepository {
  insert = mock.fn(async (_customerId: string, _code: string, _type: TokenType, _expiresAt: Date): Promise<void> => {});
  find = mock.fn(
    async (_customerId: string, _code: string, _type: TokenType): Promise<{ id: string; expiresAt: Date } | null> => null,
  );
  deleteByCustomerAndType = mock.fn(async (_customerId: string, _type: TokenType): Promise<void> => {});
  delete = mock.fn(async (_id: string): Promise<void> => {});
}

export const mockTokenRepository = new MockTokenRepository();

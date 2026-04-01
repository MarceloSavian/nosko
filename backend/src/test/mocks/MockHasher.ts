import { mock } from 'node:test';
import type { IHasher } from '../../data/domain/customer/IHasher.js';

class MockHasher implements IHasher {
  hash = mock.fn(async (_value: string): Promise<string> => '');
  compare = mock.fn(async (_value: string, _hash: string): Promise<boolean> => false);
}

export const mockHasher = new MockHasher();

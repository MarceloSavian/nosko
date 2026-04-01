import { mock } from 'node:test';
import type { IJwtService, JwtPayload } from '../../data/domain/auth/IJwtService.js';

class MockJwtService implements IJwtService {
  sign = mock.fn(async (_payload: JwtPayload): Promise<string> => '');
  verify = mock.fn(async (_token: string): Promise<JwtPayload> => ({ sub: '', email: '' }));
}

export const mockJwtService = new MockJwtService();

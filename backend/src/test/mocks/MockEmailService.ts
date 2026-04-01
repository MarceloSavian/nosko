import { mock } from 'node:test';
import type { IEmailService } from '../../data/domain/email/IEmailService.js';

class MockEmailService implements IEmailService {
  send = mock.fn(async (_to: string, _subject: string, _html: string): Promise<void> => {});
}

export const mockEmailService = new MockEmailService();

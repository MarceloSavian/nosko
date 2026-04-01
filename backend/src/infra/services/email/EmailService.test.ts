import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import { EmailService } from './EmailService.js';

describe('EmailService', () => {
  const mockSend = mock.fn(async () => ({}));

  const makeSut = () => {
    const sut = new EmailService('test-api-key', 'no-reply@test.com');
    (sut as unknown as { client: { emails: { send: typeof mockSend } } }).client.emails.send =
      mockSend;
    return { sut };
  };

  beforeEach(() => {
    mockSend.mock.resetCalls();
  });

  describe('send()', () => {
    it('should call resend emails.send with correct params', async () => {
      const { sut } = makeSut();

      await sut.send('user@test.com', 'Hello', '<p>Hi</p>');

      assert.equal(mockSend.mock.callCount(), 1);
      assert.deepEqual(mockSend.mock.calls[0]?.arguments[0], {
        from: 'no-reply@test.com',
        to: 'user@test.com',
        subject: 'Hello',
        html: '<p>Hi</p>',
      });
    });

    it('should propagate errors from resend', async () => {
      const { sut } = makeSut();
      mockSend.mock.mockImplementationOnce(async () => {
        throw new Error('Resend API error');
      });

      await assert.rejects(async () => sut.send('user@test.com', 'Hello', '<p>Hi</p>'), {
        message: 'Resend API error',
      });
    });
  });
});

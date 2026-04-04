import { describe, expect, it, vi } from 'vitest';
import type { IVerifyEmailGateway } from '@/data/protocols/auth/IVerifyEmailGateway';
import {
  EmailAlreadyVerifiedError,
  InvalidVerificationCodeError,
  UnexpectedError,
  VerificationCodeExpiredError,
} from '@/domain/errors/auth';
import type { VerifyEmailInput } from '@/domain/models/auth/Auth';
import { RemoteVerifyEmail } from './RemoteVerifyEmail';

const verifyInput: VerifyEmailInput = {
  email: 'test@example.com',
  code: '123456',
};

describe('RemoteVerifyEmail', () => {
  const makeSut = () => {
    const gatewaySpy: IVerifyEmailGateway = { verifyEmail: vi.fn() };
    const sut = new RemoteVerifyEmail(gatewaySpy);
    return { sut, gatewaySpy };
  };

  describe('execute()', () => {
    it('should call gateway with correct input', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'verifyEmail').mockResolvedValueOnce();

      await sut.execute(verifyInput);

      expect(gatewaySpy.verifyEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
        code: '123456',
      });
      expect(gatewaySpy.verifyEmail).toHaveBeenCalledOnce();
    });

    it('should rethrow EmailAlreadyVerifiedError', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'verifyEmail').mockRejectedValueOnce(new EmailAlreadyVerifiedError());

      await expect(sut.execute(verifyInput)).rejects.toThrow(EmailAlreadyVerifiedError);
    });

    it('should rethrow InvalidVerificationCodeError', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'verifyEmail').mockRejectedValueOnce(new InvalidVerificationCodeError());

      await expect(sut.execute(verifyInput)).rejects.toThrow(InvalidVerificationCodeError);
    });

    it('should rethrow VerificationCodeExpiredError', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'verifyEmail').mockRejectedValueOnce(new VerificationCodeExpiredError());

      await expect(sut.execute(verifyInput)).rejects.toThrow(VerificationCodeExpiredError);
    });

    it('should throw UnexpectedError for unknown errors', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'verifyEmail').mockRejectedValueOnce(new Error('network error'));

      await expect(sut.execute(verifyInput)).rejects.toThrow(UnexpectedError);
    });
  });
});

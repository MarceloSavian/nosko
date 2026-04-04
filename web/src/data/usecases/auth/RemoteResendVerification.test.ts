import { describe, expect, it, vi } from 'vitest';
import type { IResendVerificationGateway } from '@/data/protocols/auth/IResendVerificationGateway';
import { EmailAlreadyVerifiedError, UnexpectedError } from '@/domain/errors/auth';
import type { ResendVerificationInput } from '@/domain/models/auth/Auth';
import { RemoteResendVerification } from './RemoteResendVerification';

const resendInput: ResendVerificationInput = {
  email: 'test@example.com',
};

describe('RemoteResendVerification', () => {
  const makeSut = () => {
    const gatewaySpy: IResendVerificationGateway = { resendVerification: vi.fn() };
    const sut = new RemoteResendVerification(gatewaySpy);
    return { sut, gatewaySpy };
  };

  describe('execute()', () => {
    it('should call gateway with correct input', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'resendVerification').mockResolvedValueOnce();

      await sut.execute(resendInput);

      expect(gatewaySpy.resendVerification).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(gatewaySpy.resendVerification).toHaveBeenCalledOnce();
    });

    it('should rethrow EmailAlreadyVerifiedError', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'resendVerification').mockRejectedValueOnce(
        new EmailAlreadyVerifiedError(),
      );

      await expect(sut.execute(resendInput)).rejects.toThrow(EmailAlreadyVerifiedError);
    });

    it('should throw UnexpectedError for unknown errors', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'resendVerification').mockRejectedValueOnce(new Error('network error'));

      await expect(sut.execute(resendInput)).rejects.toThrow(UnexpectedError);
    });
  });
});

import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import {
  EmailAlreadyVerifiedError,
  InvalidVerificationCodeError,
  UnexpectedError,
  VerificationCodeExpiredError,
} from '@/domain/errors/auth';
import { VerifyEmailGateway } from './VerifyEmailGateway';

const gatewayInput = {
  email: 'test@example.com',
  code: '123456',
};

describe('VerifyEmailGateway', () => {
  const makeSut = () => {
    const httpClientSpy: IHttpClient = { request: vi.fn() };
    const sut = new VerifyEmailGateway(httpClientSpy);
    return { sut, httpClientSpy };
  };

  describe('verifyEmail()', () => {
    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: {},
      });

      await sut.verifyEmail(gatewayInput);

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/verify-email',
        method: 'post',
        body: gatewayInput,
      });
    });

    it('should resolve on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: {},
      });

      await expect(sut.verifyEmail(gatewayInput)).resolves.toBeUndefined();
    });

    it('should throw EmailAlreadyVerifiedError on 400 with matching message', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 400,
        body: { message: 'Email already verified' },
      });

      await expect(sut.verifyEmail(gatewayInput)).rejects.toThrow(EmailAlreadyVerifiedError);
    });

    it('should throw VerificationCodeExpiredError on 400 with matching message', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 400,
        body: { message: 'Verification code expired' },
      });

      await expect(sut.verifyEmail(gatewayInput)).rejects.toThrow(VerificationCodeExpiredError);
    });

    it('should throw InvalidVerificationCodeError on 400 with unknown message', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 400,
        body: { message: 'Invalid code' },
      });

      await expect(sut.verifyEmail(gatewayInput)).rejects.toThrow(InvalidVerificationCodeError);
    });

    it('should throw UnexpectedError on 500', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: { message: 'Internal server error' },
      });

      await expect(sut.verifyEmail(gatewayInput)).rejects.toThrow(UnexpectedError);
    });
  });
});

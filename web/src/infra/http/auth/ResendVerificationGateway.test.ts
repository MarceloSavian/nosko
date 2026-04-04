import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import { EmailAlreadyVerifiedError, UnexpectedError } from '@/domain/errors/auth';
import { ResendVerificationGateway } from './ResendVerificationGateway';

const gatewayInput = {
  email: 'test@example.com',
};

describe('ResendVerificationGateway', () => {
  const makeSut = () => {
    const httpClientSpy: IHttpClient = { request: vi.fn() };
    const sut = new ResendVerificationGateway(httpClientSpy);
    return { sut, httpClientSpy };
  };

  describe('resendVerification()', () => {
    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 204,
        body: {},
      });

      await sut.resendVerification(gatewayInput);

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/resend-verification',
        method: 'post',
        body: gatewayInput,
      });
    });

    it('should resolve on 204', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 204,
        body: {},
      });

      await expect(sut.resendVerification(gatewayInput)).resolves.toBeUndefined();
    });

    it('should throw EmailAlreadyVerifiedError on 400 with matching message', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 400,
        body: { message: 'Email already verified' },
      });

      await expect(sut.resendVerification(gatewayInput)).rejects.toThrow(EmailAlreadyVerifiedError);
    });

    it('should throw UnexpectedError on 400 with unknown message', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 400,
        body: { message: 'Some other error' },
      });

      await expect(sut.resendVerification(gatewayInput)).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError on 500', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: { message: 'Internal server error' },
      });

      await expect(sut.resendVerification(gatewayInput)).rejects.toThrow(UnexpectedError);
    });
  });
});

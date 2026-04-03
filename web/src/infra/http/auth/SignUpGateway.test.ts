import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import { EmailAlreadyRegisteredError, UnexpectedError } from '@/domain/errors/auth';
import type { SignupResult } from '@/domain/models/auth/Auth';
import { SignUpGateway } from './SignUpGateway';

const gatewayInput = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  language: 'en-US',
};

const signupResult: SignupResult = {
  id: 'customer-id',
  email: 'test@example.com',
  name: 'Test User',
  language: 'en-US',
  avatarUrl: null,
  verifiedAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
};

describe('SignUpGateway', () => {
  const makeSut = () => {
    const httpClientSpy: IHttpClient = { request: vi.fn() };
    const sut = new SignUpGateway(httpClientSpy);
    return { sut, httpClientSpy };
  };

  describe('signUp()', () => {
    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 201,
        body: signupResult,
      });

      await sut.signUp(gatewayInput);

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/signup',
        method: 'post',
        body: gatewayInput,
      });
    });

    it('should return signup result on 201', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 201,
        body: signupResult,
      });

      const result = await sut.signUp(gatewayInput);

      expect(result).toEqual(signupResult);
    });

    it('should throw EmailAlreadyRegisteredError on 400 with matching message', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 400,
        body: { message: 'Email already registered' },
      });

      await expect(sut.signUp(gatewayInput)).rejects.toThrow(EmailAlreadyRegisteredError);
    });

    it('should throw UnexpectedError on 400 with unknown message', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 400,
        body: { message: 'Some other error' },
      });

      await expect(sut.signUp(gatewayInput)).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError on 500', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: { message: 'Internal server error' },
      });

      await expect(sut.signUp(gatewayInput)).rejects.toThrow(UnexpectedError);
    });
  });
});

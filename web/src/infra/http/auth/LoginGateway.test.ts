import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import {
  EmailNotVerifiedError,
  InvalidCredentialsError,
  UnexpectedError,
} from '@/domain/errors/auth';
import type { LoginResult } from '@/domain/models/auth/Auth';
import { LoginGateway } from './LoginGateway';

const gatewayInput = {
  email: 'test@example.com',
  password: 'password123',
};

const loginResult: LoginResult = {
  accessToken: 'jwt-token',
};

describe('LoginGateway', () => {
  const makeSut = () => {
    const httpClientSpy: IHttpClient = { request: vi.fn() };
    const sut = new LoginGateway(httpClientSpy);
    return { sut, httpClientSpy };
  };

  describe('login()', () => {
    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: loginResult,
      });

      await sut.login(gatewayInput);

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/login',
        method: 'post',
        body: gatewayInput,
      });
    });

    it('should return login result on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: loginResult,
      });

      const result = await sut.login(gatewayInput);

      expect(result).toEqual(loginResult);
    });

    it('should throw InvalidCredentialsError on 401', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 401,
        body: { message: 'Invalid credentials' },
      });

      await expect(sut.login(gatewayInput)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw EmailNotVerifiedError on 403', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 403,
        body: { message: 'Email not verified' },
      });

      await expect(sut.login(gatewayInput)).rejects.toThrow(EmailNotVerifiedError);
    });

    it('should throw UnexpectedError on 500', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: { message: 'Internal server error' },
      });

      await expect(sut.login(gatewayInput)).rejects.toThrow(UnexpectedError);
    });
  });
});

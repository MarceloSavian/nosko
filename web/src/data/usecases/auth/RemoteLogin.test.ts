import { describe, expect, it, vi } from 'vitest';
import type { ILoginGateway } from '@/data/protocols/auth/ILoginGateway';
import {
  EmailNotVerifiedError,
  InvalidCredentialsError,
  UnexpectedError,
} from '@/domain/errors/auth';
import type { LoginInput, LoginResult } from '@/domain/models/auth/Auth';
import { RemoteLogin } from './RemoteLogin';

const loginInput: LoginInput = {
  email: 'test@example.com',
  password: 'password123',
};

const loginResult: LoginResult = {
  accessToken: 'jwt-token',
};

describe('RemoteLogin', () => {
  const makeSut = () => {
    const gatewaySpy: ILoginGateway = { login: vi.fn() };
    const sut = new RemoteLogin(gatewaySpy);
    return { sut, gatewaySpy };
  };

  describe('execute()', () => {
    it('should call gateway with correct input', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'login').mockResolvedValueOnce(loginResult);

      await sut.execute(loginInput);

      expect(gatewaySpy.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(gatewaySpy.login).toHaveBeenCalledOnce();
    });

    it('should return the login result on success', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'login').mockResolvedValueOnce(loginResult);

      const result = await sut.execute(loginInput);

      expect(result).toEqual(loginResult);
    });

    it('should rethrow InvalidCredentialsError', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'login').mockRejectedValueOnce(new InvalidCredentialsError());

      await expect(sut.execute(loginInput)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should rethrow EmailNotVerifiedError', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'login').mockRejectedValueOnce(new EmailNotVerifiedError());

      await expect(sut.execute(loginInput)).rejects.toThrow(EmailNotVerifiedError);
    });

    it('should throw UnexpectedError for unknown errors', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'login').mockRejectedValueOnce(new Error('network error'));

      await expect(sut.execute(loginInput)).rejects.toThrow(UnexpectedError);
    });
  });
});

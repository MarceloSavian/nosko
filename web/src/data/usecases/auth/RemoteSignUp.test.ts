import { describe, expect, it, vi } from 'vitest';
import type { ISignUpGateway } from '@/data/protocols/auth/ISignUpGateway';
import { EmailAlreadyRegisteredError, UnexpectedError } from '@/domain/errors/auth';
import type { SignupInput, SignupResult } from '@/domain/models/auth/Auth';
import { RemoteSignUp } from './RemoteSignUp';

const signupResult: SignupResult = {
  id: 'customer-id',
  email: 'test@example.com',
  name: 'Test User',
  language: 'en-US',
  avatarUrl: null,
  verifiedAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
};

const signupInput: SignupInput = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  language: 'en-US',
};

describe('RemoteSignUp', () => {
  const makeSut = () => {
    const gatewaySpy: ISignUpGateway = { signUp: vi.fn() };
    const sut = new RemoteSignUp(gatewaySpy);
    return { sut, gatewaySpy };
  };

  describe('execute()', () => {
    it('should call gateway with correct input', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'signUp').mockResolvedValueOnce(signupResult);

      await sut.execute(signupInput);

      expect(gatewaySpy.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        language: 'en-US',
      });
      expect(gatewaySpy.signUp).toHaveBeenCalledOnce();
    });

    it('should return the signup result on success', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'signUp').mockResolvedValueOnce(signupResult);

      const result = await sut.execute(signupInput);

      expect(result).toEqual(signupResult);
    });

    it('should rethrow EmailAlreadyRegisteredError', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'signUp').mockRejectedValueOnce(new EmailAlreadyRegisteredError());

      await expect(sut.execute(signupInput)).rejects.toThrow(EmailAlreadyRegisteredError);
    });

    it('should throw UnexpectedError for unknown errors', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'signUp').mockRejectedValueOnce(new Error('network error'));

      await expect(sut.execute(signupInput)).rejects.toThrow(UnexpectedError);
    });
  });
});

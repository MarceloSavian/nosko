import { describe, expect, it, vi } from 'vitest';
import type { IProfileGateway } from '@/data/protocols/profile/IProfileGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import type { CustomerSchema, UpdateProfileInput } from '@/domain/models/profile/Profile';
import { RemoteUpdateProfile } from './RemoteUpdateProfile';

const updateInput: UpdateProfileInput = {
  name: 'Jane Doe',
  language: 'pt-BR',
};

const profileResult: CustomerSchema = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Jane Doe',
  language: 'pt-BR',
  avatarUrl: null,
  verifiedAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('RemoteUpdateProfile', () => {
  const makeSut = () => {
    const gatewaySpy: IProfileGateway = {
      loadProfile: vi.fn(),
      updateProfile: vi.fn(),
      deleteAccount: vi.fn(),
      loadCurrencyDefaults: vi.fn(),
      setCurrencyDefaults: vi.fn(),
    };
    const sut = new RemoteUpdateProfile(gatewaySpy);
    return { sut, gatewaySpy };
  };

  describe('execute()', () => {
    it('should call gateway.updateProfile with correct input', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'updateProfile').mockResolvedValueOnce(profileResult);

      await sut.execute(updateInput);

      expect(gatewaySpy.updateProfile).toHaveBeenCalledWith(updateInput);
      expect(gatewaySpy.updateProfile).toHaveBeenCalledOnce();
    });

    it('should return the updated profile on success', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'updateProfile').mockResolvedValueOnce(profileResult);

      const result = await sut.execute(updateInput);

      expect(result).toEqual(profileResult);
    });

    it('should throw UnexpectedError when gateway throws', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'updateProfile').mockRejectedValueOnce(new Error('network error'));

      await expect(sut.execute(updateInput)).rejects.toThrow(UnexpectedError);
    });
  });
});

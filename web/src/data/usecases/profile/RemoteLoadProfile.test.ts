import { describe, expect, it, vi } from 'vitest';
import type { IProfileGateway } from '@/data/protocols/profile/IProfileGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import type { CustomerSchema } from '@/domain/models/profile/Profile';
import { RemoteLoadProfile } from './RemoteLoadProfile';

const profileResult: CustomerSchema = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'John Doe',
  language: 'en-US',
  avatarUrl: null,
  verifiedAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('RemoteLoadProfile', () => {
  const makeSut = () => {
    const gatewaySpy: IProfileGateway = {
      loadProfile: vi.fn(),
      updateProfile: vi.fn(),
      deleteAccount: vi.fn(),
      loadCurrencyDefaults: vi.fn(),
      setCurrencyDefaults: vi.fn(),
    };
    const sut = new RemoteLoadProfile(gatewaySpy);
    return { sut, gatewaySpy };
  };

  describe('execute()', () => {
    it('should call gateway.loadProfile', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'loadProfile').mockResolvedValueOnce(profileResult);

      await sut.execute();

      expect(gatewaySpy.loadProfile).toHaveBeenCalledOnce();
    });

    it('should return the profile on success', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'loadProfile').mockResolvedValueOnce(profileResult);

      const result = await sut.execute();

      expect(result).toEqual(profileResult);
    });

    it('should throw UnexpectedError when gateway throws', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'loadProfile').mockRejectedValueOnce(new Error('network error'));

      await expect(sut.execute()).rejects.toThrow(UnexpectedError);
    });
  });
});

import { describe, expect, it, vi } from 'vitest';
import type { IProfileGateway } from '@/data/protocols/profile/IProfileGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import { RemoteDeleteAccount } from './RemoteDeleteAccount';

describe('RemoteDeleteAccount', () => {
  const makeSut = () => {
    const gatewaySpy: IProfileGateway = {
      loadProfile: vi.fn(),
      updateProfile: vi.fn(),
      deleteAccount: vi.fn(),
      loadCurrencyDefaults: vi.fn(),
      setCurrencyDefaults: vi.fn(),
    };
    const sut = new RemoteDeleteAccount(gatewaySpy);
    return { sut, gatewaySpy };
  };

  describe('execute()', () => {
    it('should call gateway.deleteAccount', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'deleteAccount').mockResolvedValueOnce();

      await sut.execute();

      expect(gatewaySpy.deleteAccount).toHaveBeenCalledOnce();
    });

    it('should resolve on success', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'deleteAccount').mockResolvedValueOnce();

      await expect(sut.execute()).resolves.toBeUndefined();
    });

    it('should throw UnexpectedError when gateway throws', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'deleteAccount').mockRejectedValueOnce(new Error('network error'));

      await expect(sut.execute()).rejects.toThrow(UnexpectedError);
    });
  });
});

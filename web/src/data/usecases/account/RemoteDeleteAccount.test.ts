import { describe, expect, it, vi } from 'vitest';
import type { IAccountGateway } from '@/data/protocols/account/IAccountGateway';
import { AccountNotFoundError } from '@/domain/errors/account';
import { UnexpectedError } from '@/domain/errors/auth';
import { RemoteDeleteAccount } from './RemoteDeleteAccount';

describe('RemoteDeleteAccount', () => {
  const makeSut = () => {
    const gatewaySpy: IAccountGateway = {
      loadAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      loadOverview: vi.fn(),
    };
    const sut = new RemoteDeleteAccount(gatewaySpy);
    return { sut, gatewaySpy };
  };

  describe('execute()', () => {
    it('should call gateway.delete with correct id', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'delete').mockResolvedValueOnce(undefined);

      await sut.execute('acc-1');

      expect(gatewaySpy.delete).toHaveBeenCalledWith('acc-1');
      expect(gatewaySpy.delete).toHaveBeenCalledOnce();
    });

    it('should resolve on success', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'delete').mockResolvedValueOnce(undefined);

      await expect(sut.execute('acc-1')).resolves.toBeUndefined();
    });

    it('should rethrow AccountNotFoundError', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'delete').mockRejectedValueOnce(new AccountNotFoundError());

      await expect(sut.execute('acc-1')).rejects.toThrow(AccountNotFoundError);
    });

    it('should throw UnexpectedError for unknown errors', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'delete').mockRejectedValueOnce(new Error('network error'));

      await expect(sut.execute('acc-1')).rejects.toThrow(UnexpectedError);
    });
  });
});

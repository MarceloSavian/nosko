import { describe, expect, it, vi } from 'vitest';
import type { IAccountGateway } from '@/data/protocols/account/IAccountGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import type { AccountOverview } from '@/domain/models/account/Account';
import { RemoteLoadAccountOverview } from './RemoteLoadAccountOverview';

const overview: AccountOverview = {
  totalsByCurrency: [
    { currencyCode: 'USD', total: 60000 },
    { currencyCode: 'EUR', total: 50000 },
  ],
};

describe('RemoteLoadAccountOverview', () => {
  const makeSut = () => {
    const gatewaySpy: IAccountGateway = {
      loadAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      loadOverview: vi.fn(),
    };
    const sut = new RemoteLoadAccountOverview(gatewaySpy);
    return { sut, gatewaySpy };
  };

  describe('execute()', () => {
    it('should call gateway.loadOverview', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'loadOverview').mockResolvedValueOnce(overview);

      await sut.execute();

      expect(gatewaySpy.loadOverview).toHaveBeenCalledOnce();
    });

    it('should return the overview on success', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'loadOverview').mockResolvedValueOnce(overview);

      const result = await sut.execute();

      expect(result).toEqual(overview);
    });

    it('should throw UnexpectedError on failure', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'loadOverview').mockRejectedValueOnce(new Error('network error'));

      await expect(sut.execute()).rejects.toThrow(UnexpectedError);
    });
  });
});

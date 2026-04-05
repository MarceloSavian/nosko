import { describe, expect, it, vi } from 'vitest';
import type { IProfileGateway } from '@/data/protocols/profile/IProfileGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import type { CurrencyDefaultSchema } from '@/domain/models/profile/Profile';
import { RemoteLoadCurrencyDefaults } from './RemoteLoadCurrencyDefaults';

const currencyDefaults: CurrencyDefaultSchema[] = [
  { id: 'cd-1', currencyCode: 'USD', displayOrder: 0 },
  { id: 'cd-2', currencyCode: 'BRL', displayOrder: 1 },
];

describe('RemoteLoadCurrencyDefaults', () => {
  const makeSut = () => {
    const gatewaySpy: IProfileGateway = {
      loadProfile: vi.fn(),
      updateProfile: vi.fn(),
      deleteAccount: vi.fn(),
      loadCurrencyDefaults: vi.fn(),
      setCurrencyDefaults: vi.fn(),
    };
    const sut = new RemoteLoadCurrencyDefaults(gatewaySpy);
    return { sut, gatewaySpy };
  };

  describe('execute()', () => {
    it('should call gateway.loadCurrencyDefaults', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'loadCurrencyDefaults').mockResolvedValueOnce(currencyDefaults);

      await sut.execute();

      expect(gatewaySpy.loadCurrencyDefaults).toHaveBeenCalledOnce();
    });

    it('should return the currency defaults on success', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'loadCurrencyDefaults').mockResolvedValueOnce(currencyDefaults);

      const result = await sut.execute();

      expect(result).toEqual(currencyDefaults);
    });

    it('should throw UnexpectedError when gateway throws', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'loadCurrencyDefaults').mockRejectedValueOnce(
        new Error('network error'),
      );

      await expect(sut.execute()).rejects.toThrow(UnexpectedError);
    });
  });
});

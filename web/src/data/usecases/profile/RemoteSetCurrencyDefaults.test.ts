import { describe, expect, it, vi } from 'vitest';
import type { IProfileGateway } from '@/data/protocols/profile/IProfileGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import type {
  CurrencyDefaultSchema,
  SetCurrencyDefaultsInput,
} from '@/domain/models/profile/Profile';
import { RemoteSetCurrencyDefaults } from './RemoteSetCurrencyDefaults';

const setCurrencyInput: SetCurrencyDefaultsInput = {
  currencies: [
    { currencyCode: 'USD', displayOrder: 0 },
    { currencyCode: 'BRL', displayOrder: 1 },
  ],
};

const currencyDefaults: CurrencyDefaultSchema[] = [
  { id: 'cd-1', currencyCode: 'USD', displayOrder: 0 },
  { id: 'cd-2', currencyCode: 'BRL', displayOrder: 1 },
];

describe('RemoteSetCurrencyDefaults', () => {
  const makeSut = () => {
    const gatewaySpy: IProfileGateway = {
      loadProfile: vi.fn(),
      updateProfile: vi.fn(),
      deleteAccount: vi.fn(),
      loadCurrencyDefaults: vi.fn(),
      setCurrencyDefaults: vi.fn(),
    };
    const sut = new RemoteSetCurrencyDefaults(gatewaySpy);
    return { sut, gatewaySpy };
  };

  describe('execute()', () => {
    it('should call gateway.setCurrencyDefaults with correct input', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'setCurrencyDefaults').mockResolvedValueOnce(currencyDefaults);

      await sut.execute(setCurrencyInput);

      expect(gatewaySpy.setCurrencyDefaults).toHaveBeenCalledWith(setCurrencyInput);
      expect(gatewaySpy.setCurrencyDefaults).toHaveBeenCalledOnce();
    });

    it('should return the currency defaults on success', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'setCurrencyDefaults').mockResolvedValueOnce(currencyDefaults);

      const result = await sut.execute(setCurrencyInput);

      expect(result).toEqual(currencyDefaults);
    });

    it('should throw UnexpectedError when gateway throws', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'setCurrencyDefaults').mockRejectedValueOnce(new Error('network error'));

      await expect(sut.execute(setCurrencyInput)).rejects.toThrow(UnexpectedError);
    });
  });
});

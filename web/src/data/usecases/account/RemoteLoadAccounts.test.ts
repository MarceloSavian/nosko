import { describe, expect, it, vi } from 'vitest';
import type { IAccountGateway } from '@/data/protocols/account/IAccountGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import type { BankAccount } from '@/domain/models/account/Account';
import { RemoteLoadAccounts } from './RemoteLoadAccounts';

const accountsList: BankAccount[] = [
  {
    id: 'acc-1',
    institutionId: 'inst-1',
    accountName: 'Main Checking',
    currencyCode: 'USD',
    balance: 10000,
    accountType: 'CHECKING',
    balanceUpdatedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'acc-2',
    institutionId: 'inst-2',
    accountName: 'Savings',
    currencyCode: 'EUR',
    balance: 50000,
    accountType: 'SAVINGS',
    balanceUpdatedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

describe('RemoteLoadAccounts', () => {
  const makeSut = () => {
    const gatewaySpy: IAccountGateway = {
      loadAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      loadOverview: vi.fn(),
    };
    const sut = new RemoteLoadAccounts(gatewaySpy);
    return { sut, gatewaySpy };
  };

  describe('execute()', () => {
    it('should call gateway.loadAll', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'loadAll').mockResolvedValueOnce(accountsList);

      await sut.execute();

      expect(gatewaySpy.loadAll).toHaveBeenCalledOnce();
    });

    it('should return the accounts list on success', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'loadAll').mockResolvedValueOnce(accountsList);

      const result = await sut.execute();

      expect(result).toEqual(accountsList);
    });

    it('should throw UnexpectedError on failure', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'loadAll').mockRejectedValueOnce(new Error('network error'));

      await expect(sut.execute()).rejects.toThrow(UnexpectedError);
    });
  });
});

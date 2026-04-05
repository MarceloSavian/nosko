import { describe, expect, it, vi } from 'vitest';
import type { IAccountGateway } from '@/data/protocols/account/IAccountGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import type { BankAccount, CreateBankAccountInput } from '@/domain/models/account/Account';
import { RemoteCreateAccount } from './RemoteCreateAccount';

const createInput: CreateBankAccountInput = {
  institutionId: 'inst-1',
  accountName: 'Main Checking',
  currencyCode: 'USD',
  accountType: 'CHECKING',
  balance: 10000,
};

const bankAccount: BankAccount = {
  id: 'acc-1',
  institutionId: 'inst-1',
  accountName: 'Main Checking',
  currencyCode: 'USD',
  balance: 10000,
  accountType: 'CHECKING',
  balanceUpdatedAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('RemoteCreateAccount', () => {
  const makeSut = () => {
    const gatewaySpy: IAccountGateway = {
      loadAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      loadOverview: vi.fn(),
    };
    const sut = new RemoteCreateAccount(gatewaySpy);
    return { sut, gatewaySpy };
  };

  describe('execute()', () => {
    it('should call gateway.create with correct input', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'create').mockResolvedValueOnce(bankAccount);

      await sut.execute(createInput);

      expect(gatewaySpy.create).toHaveBeenCalledWith(createInput);
      expect(gatewaySpy.create).toHaveBeenCalledOnce();
    });

    it('should return the created account on success', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'create').mockResolvedValueOnce(bankAccount);

      const result = await sut.execute(createInput);

      expect(result).toEqual(bankAccount);
    });

    it('should throw UnexpectedError on failure', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'create').mockRejectedValueOnce(new Error('network error'));

      await expect(sut.execute(createInput)).rejects.toThrow(UnexpectedError);
    });
  });
});

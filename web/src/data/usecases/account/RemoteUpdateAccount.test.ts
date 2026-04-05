import { describe, expect, it, vi } from 'vitest';
import type { IAccountGateway } from '@/data/protocols/account/IAccountGateway';
import { AccountNotFoundError } from '@/domain/errors/account';
import { UnexpectedError } from '@/domain/errors/auth';
import type { BankAccount, UpdateBankAccountInput } from '@/domain/models/account/Account';
import { RemoteUpdateAccount } from './RemoteUpdateAccount';

const updateInput: UpdateBankAccountInput = {
  accountName: 'Updated Checking',
  balance: 20000,
  accountType: 'SAVINGS',
};

const updatedAccount: BankAccount = {
  id: 'acc-1',
  institutionId: 'inst-1',
  accountName: 'Updated Checking',
  currencyCode: 'USD',
  balance: 20000,
  accountType: 'SAVINGS',
  balanceUpdatedAt: '2026-01-02T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('RemoteUpdateAccount', () => {
  const makeSut = () => {
    const gatewaySpy: IAccountGateway = {
      loadAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      loadOverview: vi.fn(),
    };
    const sut = new RemoteUpdateAccount(gatewaySpy);
    return { sut, gatewaySpy };
  };

  describe('execute()', () => {
    it('should call gateway.update with correct id and input', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'update').mockResolvedValueOnce(updatedAccount);

      await sut.execute('acc-1', updateInput);

      expect(gatewaySpy.update).toHaveBeenCalledWith('acc-1', updateInput);
      expect(gatewaySpy.update).toHaveBeenCalledOnce();
    });

    it('should return the updated account on success', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'update').mockResolvedValueOnce(updatedAccount);

      const result = await sut.execute('acc-1', updateInput);

      expect(result).toEqual(updatedAccount);
    });

    it('should rethrow AccountNotFoundError', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'update').mockRejectedValueOnce(new AccountNotFoundError());

      await expect(sut.execute('acc-1', updateInput)).rejects.toThrow(AccountNotFoundError);
    });

    it('should throw UnexpectedError for unknown errors', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'update').mockRejectedValueOnce(new Error('network error'));

      await expect(sut.execute('acc-1', updateInput)).rejects.toThrow(UnexpectedError);
    });
  });
});

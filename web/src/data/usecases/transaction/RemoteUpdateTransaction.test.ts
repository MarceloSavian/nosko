import { describe, expect, it, vi } from 'vitest';
import type { ITransactionGateway } from '@/data/protocols/transaction/ITransactionGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import { TransactionNotFoundError } from '@/domain/errors/transaction';
import type { Transaction, UpdateTransactionInput } from '@/domain/models/transaction/Transaction';
import { RemoteUpdateTransaction } from './RemoteUpdateTransaction';

const updateInput: UpdateTransactionInput = {
  amount: -7500,
  description: 'Updated grocery shopping',
};

const updatedTransaction: Transaction = {
  id: 'tx-1',
  bankAccountId: 'acc-1',
  categoryId: null,
  budgetItemId: null,
  amount: -7500,
  description: 'Updated grocery shopping',
  transactionDate: '2026-04-01',
  createdAt: '2026-04-01T10:00:00Z',
};

describe('RemoteUpdateTransaction', () => {
  const makeSut = () => {
    const gatewaySpy: ITransactionGateway = {
      load: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };
    const sut = new RemoteUpdateTransaction(gatewaySpy);
    return { sut, gatewaySpy };
  };

  describe('execute()', () => {
    it('should call gateway.update with correct id and input', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'update').mockResolvedValueOnce(updatedTransaction);

      await sut.execute('tx-1', updateInput);

      expect(gatewaySpy.update).toHaveBeenCalledWith('tx-1', updateInput);
      expect(gatewaySpy.update).toHaveBeenCalledOnce();
    });

    it('should return the updated transaction on success', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'update').mockResolvedValueOnce(updatedTransaction);

      const result = await sut.execute('tx-1', updateInput);

      expect(result).toEqual(updatedTransaction);
    });

    it('should rethrow TransactionNotFoundError', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'update').mockRejectedValueOnce(new TransactionNotFoundError());

      await expect(sut.execute('tx-1', updateInput)).rejects.toThrow(TransactionNotFoundError);
    });

    it('should throw UnexpectedError for unknown errors', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'update').mockRejectedValueOnce(new Error('network error'));

      await expect(sut.execute('tx-1', updateInput)).rejects.toThrow(UnexpectedError);
    });
  });
});

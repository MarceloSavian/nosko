import { describe, expect, it, vi } from 'vitest';
import type { ITransactionGateway } from '@/data/protocols/transaction/ITransactionGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import type { CreateTransactionInput, Transaction } from '@/domain/models/transaction/Transaction';
import { RemoteCreateTransaction } from './RemoteCreateTransaction';

const input: CreateTransactionInput = {
  bankAccountId: '550e8400-e29b-41d4-a716-446655440000',
  amount: -5000,
  description: 'Grocery shopping',
  transactionDate: '2026-04-01',
};

const transaction: Transaction = {
  id: 'tx-1',
  bankAccountId: '550e8400-e29b-41d4-a716-446655440000',
  categoryId: null,
  budgetItemId: null,
  amount: -5000,
  description: 'Grocery shopping',
  transactionDate: '2026-04-01',
  createdAt: '2026-04-01T10:00:00Z',
};

describe('RemoteCreateTransaction', () => {
  const makeSut = () => {
    const gatewaySpy: ITransactionGateway = {
      load: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };
    const sut = new RemoteCreateTransaction(gatewaySpy);
    return { sut, gatewaySpy };
  };

  describe('execute()', () => {
    it('should call gateway.create with correct input', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'create').mockResolvedValueOnce(transaction);

      await sut.execute(input);

      expect(gatewaySpy.create).toHaveBeenCalledWith(input);
      expect(gatewaySpy.create).toHaveBeenCalledOnce();
    });

    it('should return the created transaction on success', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'create').mockResolvedValueOnce(transaction);

      const result = await sut.execute(input);

      expect(result).toEqual(transaction);
    });

    it('should throw UnexpectedError when gateway throws', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'create').mockRejectedValueOnce(new Error('network error'));

      await expect(sut.execute(input)).rejects.toThrow(UnexpectedError);
    });
  });
});

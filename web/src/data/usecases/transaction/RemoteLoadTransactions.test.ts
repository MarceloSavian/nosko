import { describe, expect, it, vi } from 'vitest';
import type { ITransactionGateway } from '@/data/protocols/transaction/ITransactionGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import type { PaginatedTransactions } from '@/domain/models/transaction/Transaction';
import type { LoadTransactionsParams } from '@/domain/usecases/transaction/ILoadTransactions';
import { RemoteLoadTransactions } from './RemoteLoadTransactions';

const params: LoadTransactionsParams = {
  yearMonth: '2026-04',
  limit: 20,
  offset: 0,
};

const paginatedResult: PaginatedTransactions = {
  data: [
    {
      id: 'tx-1',
      bankAccountId: 'acc-1',
      categoryId: null,
      budgetItemId: null,
      amount: -5000,
      description: 'Grocery shopping',
      transactionDate: '2026-04-01',
      createdAt: '2026-04-01T10:00:00Z',
    },
  ],
  total: 1,
  limit: 20,
  offset: 0,
};

describe('RemoteLoadTransactions', () => {
  const makeSut = () => {
    const gatewaySpy: ITransactionGateway = {
      load: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };
    const sut = new RemoteLoadTransactions(gatewaySpy);
    return { sut, gatewaySpy };
  };

  describe('execute()', () => {
    it('should call gateway.load with correct params', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'load').mockResolvedValueOnce(paginatedResult);

      await sut.execute(params);

      expect(gatewaySpy.load).toHaveBeenCalledWith(params);
      expect(gatewaySpy.load).toHaveBeenCalledOnce();
    });

    it('should return paginated transactions on success', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'load').mockResolvedValueOnce(paginatedResult);

      const result = await sut.execute(params);

      expect(result).toEqual(paginatedResult);
    });

    it('should throw UnexpectedError when gateway throws', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'load').mockRejectedValueOnce(new Error('network error'));

      await expect(sut.execute(params)).rejects.toThrow(UnexpectedError);
    });
  });
});

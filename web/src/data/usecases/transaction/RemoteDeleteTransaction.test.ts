import { describe, expect, it, vi } from 'vitest';
import type { ITransactionGateway } from '@/data/protocols/transaction/ITransactionGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import { TransactionNotFoundError } from '@/domain/errors/transaction';
import { RemoteDeleteTransaction } from './RemoteDeleteTransaction';

describe('RemoteDeleteTransaction', () => {
  const makeSut = () => {
    const gatewaySpy: ITransactionGateway = {
      load: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };
    const sut = new RemoteDeleteTransaction(gatewaySpy);
    return { sut, gatewaySpy };
  };

  describe('execute()', () => {
    it('should call gateway.remove with correct id', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'remove').mockResolvedValueOnce(undefined);

      await sut.execute('tx-1');

      expect(gatewaySpy.remove).toHaveBeenCalledWith('tx-1');
      expect(gatewaySpy.remove).toHaveBeenCalledOnce();
    });

    it('should resolve successfully when gateway succeeds', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'remove').mockResolvedValueOnce(undefined);

      await expect(sut.execute('tx-1')).resolves.toBeUndefined();
    });

    it('should rethrow TransactionNotFoundError', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'remove').mockRejectedValueOnce(new TransactionNotFoundError());

      await expect(sut.execute('tx-1')).rejects.toThrow(TransactionNotFoundError);
    });

    it('should throw UnexpectedError for unknown errors', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'remove').mockRejectedValueOnce(new Error('network error'));

      await expect(sut.execute('tx-1')).rejects.toThrow(UnexpectedError);
    });
  });
});

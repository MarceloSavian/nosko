import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import { UnexpectedError } from '@/domain/errors/auth';
import { TransactionNotFoundError } from '@/domain/errors/transaction';
import type {
  CreateTransactionInput,
  PaginatedTransactions,
  Transaction,
  UpdateTransactionInput,
} from '@/domain/models/transaction/Transaction';
import { TransactionGateway } from './TransactionGateway';

const token = 'valid-jwt-token';

const transaction: Transaction = {
  id: 'tx-1',
  bankAccountId: 'acc-1',
  categoryId: null,
  budgetItemId: null,
  amount: -5000,
  description: 'Grocery shopping',
  transactionDate: '2026-04-01',
  createdAt: '2026-04-01T10:00:00Z',
};

const paginatedResult: PaginatedTransactions = {
  data: [transaction],
  total: 1,
  limit: 20,
  offset: 0,
};

describe('TransactionGateway', () => {
  const makeSut = (getToken: () => string | null = () => token) => {
    const httpClientSpy: IHttpClient = { request: vi.fn() };
    const sut = new TransactionGateway(httpClientSpy, getToken);
    return { sut, httpClientSpy };
  };

  describe('load()', () => {
    it('should call httpClient with correct request and auth headers', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: paginatedResult,
      });

      await sut.load({ yearMonth: '2026-04', limit: 20, offset: 0 });

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/transactions?yearMonth=2026-04&limit=20&offset=0',
        method: 'get',
        headers: { Authorization: `Bearer ${token}` },
      });
    });

    it('should include optional query params when provided', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: paginatedResult,
      });

      await sut.load({
        yearMonth: '2026-04',
        accountId: 'acc-1',
        categoryId: 'cat-1',
        limit: 10,
        offset: 5,
      });

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/transactions?yearMonth=2026-04&accountId=acc-1&categoryId=cat-1&limit=10&offset=5',
        method: 'get',
        headers: { Authorization: `Bearer ${token}` },
      });
    });

    it('should return paginated transactions on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: paginatedResult,
      });

      const result = await sut.load({ yearMonth: '2026-04' });

      expect(result).toEqual(paginatedResult);
    });

    it('should throw UnexpectedError on non-200 status', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.load({ yearMonth: '2026-04' })).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError when token is null', async () => {
      const { sut } = makeSut(() => null);

      await expect(sut.load({ yearMonth: '2026-04' })).rejects.toThrow(UnexpectedError);
    });
  });

  describe('create()', () => {
    const input: CreateTransactionInput = {
      bankAccountId: '550e8400-e29b-41d4-a716-446655440000',
      amount: -5000,
      description: 'Grocery shopping',
      transactionDate: '2026-04-01',
    };

    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 201,
        body: transaction,
      });

      await sut.create(input);

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/transactions',
        method: 'post',
        body: input,
        headers: { Authorization: `Bearer ${token}` },
      });
    });

    it('should return the created transaction on 201', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 201,
        body: transaction,
      });

      const result = await sut.create(input);

      expect(result).toEqual(transaction);
    });

    it('should throw UnexpectedError on non-201 status', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 400,
        body: {},
      });

      await expect(sut.create(input)).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError when token is null', async () => {
      const { sut } = makeSut(() => null);

      await expect(sut.create(input)).rejects.toThrow(UnexpectedError);
    });
  });

  describe('update()', () => {
    const input: UpdateTransactionInput = {
      amount: -7500,
      description: 'Updated grocery shopping',
    };

    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: transaction,
      });

      await sut.update('tx-1', input);

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/transactions/tx-1',
        method: 'put',
        body: input,
        headers: { Authorization: `Bearer ${token}` },
      });
    });

    it('should return the updated transaction on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: transaction,
      });

      const result = await sut.update('tx-1', input);

      expect(result).toEqual(transaction);
    });

    it('should throw TransactionNotFoundError on 404', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 404,
        body: {},
      });

      await expect(sut.update('tx-1', input)).rejects.toThrow(TransactionNotFoundError);
    });

    it('should throw UnexpectedError on other error status', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.update('tx-1', input)).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError when token is null', async () => {
      const { sut } = makeSut(() => null);

      await expect(sut.update('tx-1', input)).rejects.toThrow(UnexpectedError);
    });
  });

  describe('remove()', () => {
    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 204,
        body: undefined,
      });

      await sut.remove('tx-1');

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/transactions/tx-1',
        method: 'delete',
        headers: { Authorization: `Bearer ${token}` },
      });
    });

    it('should resolve successfully on 204', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 204,
        body: undefined,
      });

      await expect(sut.remove('tx-1')).resolves.toBeUndefined();
    });

    it('should throw TransactionNotFoundError on 404', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 404,
        body: {},
      });

      await expect(sut.remove('tx-1')).rejects.toThrow(TransactionNotFoundError);
    });

    it('should throw UnexpectedError on other error status', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.remove('tx-1')).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError when token is null', async () => {
      const { sut } = makeSut(() => null);

      await expect(sut.remove('tx-1')).rejects.toThrow(UnexpectedError);
    });
  });
});

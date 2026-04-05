import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import { AccountNotFoundError, UnexpectedError } from '@/domain/errors/account';
import type { BankAccount, CreateBankAccountInput } from '@/domain/models/account/Account';
import { AccountGateway } from './AccountGateway';

const token = 'jwt-token';
const authHeaders = { Authorization: `Bearer ${token}` };

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

describe('AccountGateway', () => {
  const makeSut = (tokenValue: string | null = token) => {
    const httpClientSpy: IHttpClient = { request: vi.fn() };
    const getToken = vi.fn().mockReturnValue(tokenValue);
    const sut = new AccountGateway(httpClientSpy, getToken);
    return { sut, httpClientSpy, getToken };
  };

  describe('loadAll()', () => {
    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: [bankAccount],
      });

      await sut.loadAll();

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/accounts',
        method: 'get',
        headers: authHeaders,
      });
    });

    it('should return accounts on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: [bankAccount],
      });

      const result = await sut.loadAll();

      expect(result).toEqual([bankAccount]);
    });

    it('should throw UnexpectedError on non-200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.loadAll()).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError when token is null', async () => {
      const { sut } = makeSut(null);

      await expect(sut.loadAll()).rejects.toThrow(UnexpectedError);
    });
  });

  describe('create()', () => {
    const createInput: CreateBankAccountInput = {
      institutionId: 'inst-1',
      accountName: 'Main Checking',
      currencyCode: 'USD',
      accountType: 'CHECKING',
      balance: 10000,
    };

    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 201,
        body: bankAccount,
      });

      await sut.create(createInput);

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/accounts',
        method: 'post',
        body: createInput,
        headers: authHeaders,
      });
    });

    it('should return created account on 201', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 201,
        body: bankAccount,
      });

      const result = await sut.create(createInput);

      expect(result).toEqual(bankAccount);
    });

    it('should throw UnexpectedError on non-201', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 400,
        body: {},
      });

      await expect(sut.create(createInput)).rejects.toThrow(UnexpectedError);
    });
  });

  describe('update()', () => {
    const updateInput = { accountName: 'Updated Name' };

    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: bankAccount,
      });

      await sut.update('acc-1', updateInput);

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/accounts/acc-1',
        method: 'put',
        body: updateInput,
        headers: authHeaders,
      });
    });

    it('should return updated account on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: bankAccount,
      });

      const result = await sut.update('acc-1', updateInput);

      expect(result).toEqual(bankAccount);
    });

    it('should throw AccountNotFoundError on 404', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 404,
        body: {},
      });

      await expect(sut.update('acc-1', updateInput)).rejects.toThrow(AccountNotFoundError);
    });

    it('should throw UnexpectedError on other status codes', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.update('acc-1', updateInput)).rejects.toThrow(UnexpectedError);
    });
  });

  describe('delete()', () => {
    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 204,
        body: undefined,
      });

      await sut.delete('acc-1');

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/accounts/acc-1',
        method: 'delete',
        headers: authHeaders,
      });
    });

    it('should resolve on 204', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 204,
        body: undefined,
      });

      await expect(sut.delete('acc-1')).resolves.toBeUndefined();
    });

    it('should throw AccountNotFoundError on 404', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 404,
        body: {},
      });

      await expect(sut.delete('acc-1')).rejects.toThrow(AccountNotFoundError);
    });

    it('should throw UnexpectedError on other status codes', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.delete('acc-1')).rejects.toThrow(UnexpectedError);
    });
  });

  describe('loadOverview()', () => {
    const overview = {
      totalsByCurrency: [{ currencyCode: 'USD', total: 60000 }],
    };

    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: overview,
      });

      await sut.loadOverview();

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/accounts/overview',
        method: 'get',
        headers: authHeaders,
      });
    });

    it('should return overview on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: overview,
      });

      const result = await sut.loadOverview();

      expect(result).toEqual(overview);
    });

    it('should throw UnexpectedError on non-200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.loadOverview()).rejects.toThrow(UnexpectedError);
    });
  });
});

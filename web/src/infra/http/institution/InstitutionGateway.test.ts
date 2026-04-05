import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import { UnexpectedError } from '@/domain/errors/account';
import type { Institution } from '@/domain/models/institution/Institution';
import { InstitutionGateway } from './InstitutionGateway';

const token = 'jwt-token';
const authHeaders = { Authorization: `Bearer ${token}` };

const institutionsList: Institution[] = [
  { id: 'inst-1', name: 'Bank of America', countryCode: 'US', logoUrl: 'https://logo.com/boa.png' },
  { id: 'inst-2', name: 'Nubank', countryCode: 'BR', logoUrl: null },
];

describe('InstitutionGateway', () => {
  const makeSut = (tokenValue: string | null = token) => {
    const httpClientSpy: IHttpClient = { request: vi.fn() };
    const getToken = vi.fn().mockReturnValue(tokenValue);
    const sut = new InstitutionGateway(httpClientSpy, getToken);
    return { sut, httpClientSpy, getToken };
  };

  describe('loadAll()', () => {
    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: institutionsList,
      });

      await sut.loadAll();

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/institutions',
        method: 'get',
        headers: authHeaders,
      });
    });

    it('should return institutions on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: institutionsList,
      });

      const result = await sut.loadAll();

      expect(result).toEqual(institutionsList);
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
});

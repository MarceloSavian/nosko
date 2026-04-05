import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import { UnexpectedError } from '@/domain/errors/auth';
import type {
  CurrencyDefaultSchema,
  CustomerSchema,
  SetCurrencyDefaultsInput,
  UpdateProfileInput,
} from '@/domain/models/profile/Profile';
import { ProfileGateway } from './ProfileGateway';

const token = 'valid-jwt-token';

const profileResult: CustomerSchema = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'John Doe',
  language: 'en-US',
  avatarUrl: null,
  verifiedAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
};

const currencyDefaults: CurrencyDefaultSchema[] = [
  { id: 'cd-1', currencyCode: 'USD', displayOrder: 0 },
  { id: 'cd-2', currencyCode: 'BRL', displayOrder: 1 },
];

describe('ProfileGateway', () => {
  const makeSut = (getToken: () => string | null = () => token) => {
    const httpClientSpy: IHttpClient = { request: vi.fn() };
    const sut = new ProfileGateway(httpClientSpy, getToken);
    return { sut, httpClientSpy };
  };

  describe('loadProfile()', () => {
    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: profileResult,
      });

      await sut.loadProfile();

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/me',
        method: 'get',
        headers: { Authorization: `Bearer ${token}` },
      });
    });

    it('should return profile on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: profileResult,
      });

      const result = await sut.loadProfile();

      expect(result).toEqual(profileResult);
    });

    it('should throw UnexpectedError when token is null', async () => {
      const { sut } = makeSut(() => null);

      await expect(sut.loadProfile()).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError on non-200 status', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: { message: 'Internal server error' },
      });

      await expect(sut.loadProfile()).rejects.toThrow(UnexpectedError);
    });
  });

  describe('updateProfile()', () => {
    const updateInput: UpdateProfileInput = { name: 'Jane Doe', language: 'pt-BR' };

    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: profileResult,
      });

      await sut.updateProfile(updateInput);

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/me',
        method: 'put',
        body: updateInput,
        headers: { Authorization: `Bearer ${token}` },
      });
    });

    it('should return updated profile on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      const updatedProfile = { ...profileResult, name: 'Jane Doe', language: 'pt-BR' };
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: updatedProfile,
      });

      const result = await sut.updateProfile(updateInput);

      expect(result).toEqual(updatedProfile);
    });

    it('should throw UnexpectedError when token is null', async () => {
      const { sut } = makeSut(() => null);

      await expect(sut.updateProfile(updateInput)).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError on non-200 status', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 400,
        body: { message: 'Bad request' },
      });

      await expect(sut.updateProfile(updateInput)).rejects.toThrow(UnexpectedError);
    });
  });

  describe('deleteAccount()', () => {
    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 204,
        body: null,
      });

      await sut.deleteAccount();

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/me',
        method: 'delete',
        headers: { Authorization: `Bearer ${token}` },
      });
    });

    it('should resolve on 204', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 204,
        body: null,
      });

      await expect(sut.deleteAccount()).resolves.toBeUndefined();
    });

    it('should throw UnexpectedError when token is null', async () => {
      const { sut } = makeSut(() => null);

      await expect(sut.deleteAccount()).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError on non-204 status', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: { message: 'Internal server error' },
      });

      await expect(sut.deleteAccount()).rejects.toThrow(UnexpectedError);
    });
  });

  describe('loadCurrencyDefaults()', () => {
    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: currencyDefaults,
      });

      await sut.loadCurrencyDefaults();

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/me/currencies',
        method: 'get',
        headers: { Authorization: `Bearer ${token}` },
      });
    });

    it('should return currency defaults on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: currencyDefaults,
      });

      const result = await sut.loadCurrencyDefaults();

      expect(result).toEqual(currencyDefaults);
    });

    it('should throw UnexpectedError when token is null', async () => {
      const { sut } = makeSut(() => null);

      await expect(sut.loadCurrencyDefaults()).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError on non-200 status', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 401,
        body: { message: 'Unauthorized' },
      });

      await expect(sut.loadCurrencyDefaults()).rejects.toThrow(UnexpectedError);
    });
  });

  describe('setCurrencyDefaults()', () => {
    const setCurrencyInput: SetCurrencyDefaultsInput = {
      currencies: [
        { currencyCode: 'USD', displayOrder: 0 },
        { currencyCode: 'BRL', displayOrder: 1 },
      ],
    };

    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: currencyDefaults,
      });

      await sut.setCurrencyDefaults(setCurrencyInput);

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/me/currencies',
        method: 'put',
        body: setCurrencyInput,
        headers: { Authorization: `Bearer ${token}` },
      });
    });

    it('should return currency defaults on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: currencyDefaults,
      });

      const result = await sut.setCurrencyDefaults(setCurrencyInput);

      expect(result).toEqual(currencyDefaults);
    });

    it('should throw UnexpectedError when token is null', async () => {
      const { sut } = makeSut(() => null);

      await expect(sut.setCurrencyDefaults(setCurrencyInput)).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError on non-200 status', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: { message: 'Internal server error' },
      });

      await expect(sut.setCurrencyDefaults(setCurrencyInput)).rejects.toThrow(UnexpectedError);
    });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpClient } from './HttpClient';

describe('HttpClient', () => {
  const makeSut = () => {
    const sut = new HttpClient('https://api.example.com');
    return { sut };
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('request()', () => {
    it('should call fetch with correct URL and method', async () => {
      const { sut } = makeSut();
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

      await sut.request({ url: '/v1/signup', method: 'post', body: { email: 'a@b.com' } });

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/v1/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'a@b.com' }),
      });
    });

    it('should return statusCode and parsed body', async () => {
      const { sut } = makeSut();
      const responseBody = { id: '1', email: 'a@b.com' };
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify(responseBody), { status: 201 }),
      );

      const result = await sut.request({ url: '/v1/signup', method: 'post' });

      expect(result).toEqual({ statusCode: 201, body: responseBody });
    });

    it('should handle 204 No Content without parsing body', async () => {
      const { sut } = makeSut();
      vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));

      const result = await sut.request({ url: '/v1/resource', method: 'delete' });

      expect(result).toEqual({ statusCode: 204, body: null });
    });

    it('should merge custom headers with default headers', async () => {
      const { sut } = makeSut();
      vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

      await sut.request({
        url: '/v1/test',
        method: 'get',
        headers: { Authorization: 'Bearer token' },
      });

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/v1/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token',
        },
        body: undefined,
      });
    });

    it('should not include body for requests without body', async () => {
      const { sut } = makeSut();
      vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

      await sut.request({ url: '/v1/test', method: 'get' });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/test',
        expect.objectContaining({ body: undefined }),
      );
    });
  });
});

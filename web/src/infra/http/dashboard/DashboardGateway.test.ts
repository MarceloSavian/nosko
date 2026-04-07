import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import { UnexpectedError } from '@/domain/errors/auth';
import type { DashboardData } from '@/domain/models/dashboard/Dashboard';
import { DashboardGateway } from './DashboardGateway';

const dashboardData: DashboardData = {
  yearMonth: '2026-04',
  totalSpending: -150000,
  budgetSummary: [{ categoryName: 'Food', planned: 50000, actual: 35000 }],
  recentTransactions: [
    { id: 'tx-1', description: 'Grocery Store', amount: -5000, transactionDate: '2026-04-01' },
  ],
};

describe('DashboardGateway', () => {
  const makeSut = (token: string | null = 'valid-token') => {
    const httpClientSpy: IHttpClient = { request: vi.fn() };
    const getTokenSpy = vi.fn().mockReturnValue(token);
    const sut = new DashboardGateway(httpClientSpy, getTokenSpy);
    return { sut, httpClientSpy, getTokenSpy };
  };

  describe('loadDashboard()', () => {
    it('should call httpClient with correct request including auth headers', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: dashboardData,
      });

      await sut.loadDashboard('2026-04');

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/dashboard?yearMonth=2026-04',
        method: 'get',
        headers: { Authorization: 'Bearer valid-token' },
      });
    });

    it('should return dashboard data on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: dashboardData,
      });

      const result = await sut.loadDashboard('2026-04');

      expect(result).toEqual(dashboardData);
    });

    it('should throw UnexpectedError on non-200 status', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: { message: 'Internal server error' },
      });

      await expect(sut.loadDashboard('2026-04')).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError on 401 status', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 401,
        body: { message: 'Unauthorized' },
      });

      await expect(sut.loadDashboard('2026-04')).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError when token is null', async () => {
      const { sut } = makeSut(null);

      await expect(sut.loadDashboard('2026-04')).rejects.toThrow(UnexpectedError);
    });

    it('should use token from getToken function', async () => {
      const { sut, httpClientSpy } = makeSut('my-custom-token');
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: dashboardData,
      });

      await sut.loadDashboard('2026-04');

      expect(httpClientSpy.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { Authorization: 'Bearer my-custom-token' },
        }),
      );
    });
  });
});

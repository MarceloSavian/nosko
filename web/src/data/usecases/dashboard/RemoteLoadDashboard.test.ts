import { describe, expect, it, vi } from 'vitest';
import type { IDashboardGateway } from '@/data/protocols/dashboard/IDashboardGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import type { DashboardData } from '@/domain/models/dashboard/Dashboard';
import { RemoteLoadDashboard } from './RemoteLoadDashboard';

const dashboardData: DashboardData = {
  yearMonth: '2026-04',
  totalSpending: -150000,
  budgetSummary: [{ categoryName: 'Food', planned: 50000, actual: 35000 }],
  recentTransactions: [
    { id: 'tx-1', description: 'Grocery Store', amount: -5000, transactionDate: '2026-04-01' },
  ],
};

describe('RemoteLoadDashboard', () => {
  const makeSut = () => {
    const gatewaySpy: IDashboardGateway = { loadDashboard: vi.fn() };
    const sut = new RemoteLoadDashboard(gatewaySpy);
    return { sut, gatewaySpy };
  };

  describe('execute()', () => {
    it('should call gateway with correct yearMonth', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'loadDashboard').mockResolvedValueOnce(dashboardData);

      await sut.execute('2026-04');

      expect(gatewaySpy.loadDashboard).toHaveBeenCalledWith('2026-04');
      expect(gatewaySpy.loadDashboard).toHaveBeenCalledOnce();
    });

    it('should return dashboard data on success', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'loadDashboard').mockResolvedValueOnce(dashboardData);

      const result = await sut.execute('2026-04');

      expect(result).toEqual(dashboardData);
    });

    it('should throw UnexpectedError when gateway throws', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'loadDashboard').mockRejectedValueOnce(new Error('network error'));

      await expect(sut.execute('2026-04')).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError when gateway throws UnexpectedError', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'loadDashboard').mockRejectedValueOnce(new UnexpectedError());

      await expect(sut.execute('2026-04')).rejects.toThrow(UnexpectedError);
    });
  });
});

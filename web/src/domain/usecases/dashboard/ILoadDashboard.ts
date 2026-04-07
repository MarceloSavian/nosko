import type { DashboardData } from '@/domain/models/dashboard/Dashboard';

export interface ILoadDashboard {
  execute(yearMonth: string): Promise<DashboardData>;
}

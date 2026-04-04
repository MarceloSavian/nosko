import type { DashboardData } from '@/domain/models/dashboard/Dashboard';

export interface IDashboardGateway {
  loadDashboard(yearMonth: string): Promise<DashboardData>;
}

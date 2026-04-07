import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IDashboardGateway } from '@/data/protocols/dashboard/IDashboardGateway';
import type { DashboardData } from '@/domain/models/dashboard/Dashboard';
import type { ILoadDashboard } from '@/domain/usecases/dashboard/ILoadDashboard';

export class RemoteLoadDashboard implements ILoadDashboard {
  private readonly gateway: IDashboardGateway;

  constructor(gateway: IDashboardGateway) {
    this.gateway = gateway;
  }

  async execute(yearMonth: string): Promise<DashboardData> {
    try {
      return await this.gateway.loadDashboard(yearMonth);
    } catch (error) {
      rethrowKnown(error);
    }
  }
}

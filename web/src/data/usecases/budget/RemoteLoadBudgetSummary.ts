import type { IBudgetGateway } from '@/data/protocols/budget/IBudgetGateway';
import type { BudgetSummary } from '@/domain/models/budget/BudgetPlan';
import type { ILoadBudgetSummary } from '@/domain/usecases/budget/ILoadBudgetSummary';

export class RemoteLoadBudgetSummary implements ILoadBudgetSummary {
  private readonly gateway: IBudgetGateway;

  constructor(gateway: IBudgetGateway) {
    this.gateway = gateway;
  }

  async execute(yearMonth: string): Promise<BudgetSummary> {
    return this.gateway.loadSummary(yearMonth);
  }
}

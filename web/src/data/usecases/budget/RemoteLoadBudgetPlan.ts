import type { IBudgetGateway } from '@/data/protocols/budget/IBudgetGateway';
import type { BudgetPlanWithItems } from '@/domain/models/budget/BudgetPlan';
import type { ILoadBudgetPlan } from '@/domain/usecases/budget/ILoadBudgetPlan';

export class RemoteLoadBudgetPlan implements ILoadBudgetPlan {
  private readonly gateway: IBudgetGateway;

  constructor(gateway: IBudgetGateway) {
    this.gateway = gateway;
  }

  async execute(yearMonth: string): Promise<BudgetPlanWithItems | null> {
    return this.gateway.loadPlan(yearMonth);
  }
}

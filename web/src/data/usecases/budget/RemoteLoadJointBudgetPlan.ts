import type { IBudgetGateway } from '@/data/protocols/budget/IBudgetGateway';
import type { BudgetPlanWithItems } from '@/domain/models/budget/BudgetPlan';
import type { ILoadJointBudgetPlan } from '@/domain/usecases/budget/ILoadJointBudgetPlan';

export class RemoteLoadJointBudgetPlan implements ILoadJointBudgetPlan {
  private readonly gateway: IBudgetGateway;

  constructor(gateway: IBudgetGateway) {
    this.gateway = gateway;
  }

  async execute(yearMonth: string): Promise<BudgetPlanWithItems | null> {
    return this.gateway.loadJointPlan(yearMonth);
  }
}

import type { IBudgetGateway } from '@/data/protocols/budget/IBudgetGateway';
import type { IDeleteBudgetPlan } from '@/domain/usecases/budget/IDeleteBudgetPlan';

export class RemoteDeleteBudgetPlan implements IDeleteBudgetPlan {
  private readonly gateway: IBudgetGateway;

  constructor(gateway: IBudgetGateway) {
    this.gateway = gateway;
  }

  async execute(id: string): Promise<void> {
    return this.gateway.deletePlan(id);
  }
}

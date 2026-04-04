import type { IBudgetGateway } from '@/data/protocols/budget/IBudgetGateway';
import type { IDeleteJointBudgetPlan } from '@/domain/usecases/budget/IDeleteJointBudgetPlan';

export class RemoteDeleteJointBudgetPlan implements IDeleteJointBudgetPlan {
  private readonly gateway: IBudgetGateway;

  constructor(gateway: IBudgetGateway) {
    this.gateway = gateway;
  }

  async execute(id: string): Promise<void> {
    return this.gateway.deleteJointPlan(id);
  }
}

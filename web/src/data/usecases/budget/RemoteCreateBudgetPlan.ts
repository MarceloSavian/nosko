import type { IBudgetGateway } from '@/data/protocols/budget/IBudgetGateway';
import type { BudgetPlanWithItems, CreateBudgetPlanInput } from '@/domain/models/budget/BudgetPlan';
import type { ICreateBudgetPlan } from '@/domain/usecases/budget/ICreateBudgetPlan';

export class RemoteCreateBudgetPlan implements ICreateBudgetPlan {
  private readonly gateway: IBudgetGateway;

  constructor(gateway: IBudgetGateway) {
    this.gateway = gateway;
  }

  async execute(input: CreateBudgetPlanInput): Promise<BudgetPlanWithItems> {
    return this.gateway.createPlan(input);
  }
}

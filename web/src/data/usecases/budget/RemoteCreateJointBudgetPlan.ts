import type { IBudgetGateway } from '@/data/protocols/budget/IBudgetGateway';
import type { BudgetPlanWithItems, CreateBudgetPlanInput } from '@/domain/models/budget/BudgetPlan';
import type { ICreateJointBudgetPlan } from '@/domain/usecases/budget/ICreateJointBudgetPlan';

export class RemoteCreateJointBudgetPlan implements ICreateJointBudgetPlan {
  private readonly gateway: IBudgetGateway;

  constructor(gateway: IBudgetGateway) {
    this.gateway = gateway;
  }

  async execute(input: CreateBudgetPlanInput): Promise<BudgetPlanWithItems> {
    return this.gateway.createJointPlan(input);
  }
}

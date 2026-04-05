import type { IBudgetGateway } from '@/data/protocols/budget/IBudgetGateway';
import type { AddBudgetItemInput, BudgetItem } from '@/domain/models/budget/BudgetPlan';
import type { IAddBudgetItem } from '@/domain/usecases/budget/IAddBudgetItem';

export class RemoteAddBudgetItem implements IAddBudgetItem {
  private readonly gateway: IBudgetGateway;

  constructor(gateway: IBudgetGateway) {
    this.gateway = gateway;
  }

  async execute(planId: string, input: AddBudgetItemInput): Promise<BudgetItem> {
    return this.gateway.addItem(planId, input);
  }
}

import type { IBudgetGateway } from '@/data/protocols/budget/IBudgetGateway';
import type { BudgetItem, UpdateBudgetItemInput } from '@/domain/models/budget/BudgetPlan';
import type { IUpdateBudgetItem } from '@/domain/usecases/budget/IUpdateBudgetItem';

export class RemoteUpdateBudgetItem implements IUpdateBudgetItem {
  private readonly gateway: IBudgetGateway;

  constructor(gateway: IBudgetGateway) {
    this.gateway = gateway;
  }

  async execute(planId: string, itemId: string, input: UpdateBudgetItemInput): Promise<BudgetItem> {
    return this.gateway.updateItem(planId, itemId, input);
  }
}

import type { IBudgetGateway } from '@/data/protocols/budget/IBudgetGateway';
import type { IDeleteBudgetItem } from '@/domain/usecases/budget/IDeleteBudgetItem';

export class RemoteDeleteBudgetItem implements IDeleteBudgetItem {
  private readonly gateway: IBudgetGateway;

  constructor(gateway: IBudgetGateway) {
    this.gateway = gateway;
  }

  async execute(planId: string, itemId: string): Promise<void> {
    return this.gateway.deleteItem(planId, itemId);
  }
}

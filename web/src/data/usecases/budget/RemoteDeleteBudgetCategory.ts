import type { IBudgetGateway } from '@/data/protocols/budget/IBudgetGateway';
import type { IDeleteBudgetCategory } from '@/domain/usecases/budget/IDeleteBudgetCategory';

export class RemoteDeleteBudgetCategory implements IDeleteBudgetCategory {
  private readonly gateway: IBudgetGateway;

  constructor(gateway: IBudgetGateway) {
    this.gateway = gateway;
  }

  async execute(id: string): Promise<void> {
    return this.gateway.deleteCategory(id);
  }
}

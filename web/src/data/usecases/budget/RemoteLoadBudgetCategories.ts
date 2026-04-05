import type { IBudgetGateway } from '@/data/protocols/budget/IBudgetGateway';
import type { BudgetCategory } from '@/domain/models/budget/BudgetCategory';
import type { ILoadBudgetCategories } from '@/domain/usecases/budget/ILoadBudgetCategories';

export class RemoteLoadBudgetCategories implements ILoadBudgetCategories {
  private readonly gateway: IBudgetGateway;

  constructor(gateway: IBudgetGateway) {
    this.gateway = gateway;
  }

  async execute(): Promise<BudgetCategory[]> {
    return this.gateway.loadCategories();
  }
}

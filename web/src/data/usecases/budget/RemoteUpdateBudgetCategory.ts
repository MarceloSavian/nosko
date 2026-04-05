import type { IBudgetGateway } from '@/data/protocols/budget/IBudgetGateway';
import type {
  BudgetCategory,
  UpdateBudgetCategoryInput,
} from '@/domain/models/budget/BudgetCategory';
import type { IUpdateBudgetCategory } from '@/domain/usecases/budget/IUpdateBudgetCategory';

export class RemoteUpdateBudgetCategory implements IUpdateBudgetCategory {
  private readonly gateway: IBudgetGateway;

  constructor(gateway: IBudgetGateway) {
    this.gateway = gateway;
  }

  async execute(id: string, input: UpdateBudgetCategoryInput): Promise<BudgetCategory> {
    return this.gateway.updateCategory(id, input);
  }
}

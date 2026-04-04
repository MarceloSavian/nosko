import type { IBudgetGateway } from '@/data/protocols/budget/IBudgetGateway';
import type {
  BudgetCategory,
  CreateBudgetCategoryInput,
} from '@/domain/models/budget/BudgetCategory';
import type { ICreateBudgetCategory } from '@/domain/usecases/budget/ICreateBudgetCategory';

export class RemoteCreateBudgetCategory implements ICreateBudgetCategory {
  private readonly gateway: IBudgetGateway;

  constructor(gateway: IBudgetGateway) {
    this.gateway = gateway;
  }

  async execute(input: CreateBudgetCategoryInput): Promise<BudgetCategory> {
    return this.gateway.createCategory(input);
  }
}

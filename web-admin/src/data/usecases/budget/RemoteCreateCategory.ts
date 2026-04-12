import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IBudgetCategoryGateway } from '@/data/protocols/budget/IBudgetCategoryGateway';
import type {
  BudgetCategorySchema,
  CreateBudgetCategoryInput,
} from '@/domain/models/budget/BudgetCategory';
import type { ICreateCategory } from '@/domain/usecases/budget/ICreateCategory';

export class RemoteCreateCategory implements ICreateCategory {
  private readonly gateway: IBudgetCategoryGateway;

  constructor(gateway: IBudgetCategoryGateway) {
    this.gateway = gateway;
  }

  async execute(input: CreateBudgetCategoryInput): Promise<BudgetCategorySchema> {
    try {
      return await this.gateway.create(input);
    } catch (error) {
      rethrowKnown(error);
    }
  }
}

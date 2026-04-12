import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IBudgetCategoryGateway } from '@/data/protocols/budget/IBudgetCategoryGateway';
import type {
  BudgetCategorySchema,
  UpdateBudgetCategoryInput,
} from '@/domain/models/budget/BudgetCategory';
import type { IUpdateCategory } from '@/domain/usecases/budget/IUpdateCategory';

export class RemoteUpdateCategory implements IUpdateCategory {
  private readonly gateway: IBudgetCategoryGateway;

  constructor(gateway: IBudgetCategoryGateway) {
    this.gateway = gateway;
  }

  async execute(id: string, input: UpdateBudgetCategoryInput): Promise<BudgetCategorySchema> {
    try {
      return await this.gateway.update(id, input);
    } catch (error) {
      rethrowKnown(error);
    }
  }
}

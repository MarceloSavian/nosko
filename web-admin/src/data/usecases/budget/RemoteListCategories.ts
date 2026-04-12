import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IBudgetCategoryGateway } from '@/data/protocols/budget/IBudgetCategoryGateway';
import type { BudgetCategorySchema } from '@/domain/models/budget/BudgetCategory';
import type { IListCategories } from '@/domain/usecases/budget/IListCategories';

export class RemoteListCategories implements IListCategories {
  private readonly gateway: IBudgetCategoryGateway;

  constructor(gateway: IBudgetCategoryGateway) {
    this.gateway = gateway;
  }

  async execute(): Promise<BudgetCategorySchema[]> {
    try {
      return await this.gateway.list();
    } catch (error) {
      rethrowKnown(error);
    }
  }
}

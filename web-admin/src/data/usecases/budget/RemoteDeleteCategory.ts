import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IBudgetCategoryGateway } from '@/data/protocols/budget/IBudgetCategoryGateway';
import type { IDeleteCategory } from '@/domain/usecases/budget/IDeleteCategory';

export class RemoteDeleteCategory implements IDeleteCategory {
  private readonly gateway: IBudgetCategoryGateway;

  constructor(gateway: IBudgetCategoryGateway) {
    this.gateway = gateway;
  }

  async execute(id: string): Promise<void> {
    try {
      await this.gateway.delete(id);
    } catch (error) {
      rethrowKnown(error);
    }
  }
}

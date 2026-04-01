import {
  BudgetCategoryNotFoundError,
  CannotModifySystemCategoryError,
} from '../../../domain/errors/budget.js';
import type {
  BudgetCategorySchema,
  CreateBudgetCategoryInput,
  UpdateBudgetCategoryInput,
} from '../../../domain/models/budget/BudgetCategory.js';
import type { IBudgetCategoryService } from '../../../domain/usecases/budget/IBudgetCategoryService.js';
import type { IBudgetCategoryRepository } from '../../domain/budget/IBudgetCategoryRepository.js';

export class BudgetCategoryService implements IBudgetCategoryService {
  constructor(private readonly budgetCategoryRepository: IBudgetCategoryRepository) {}

  async listCategories(): Promise<BudgetCategorySchema[]> {
    return await this.budgetCategoryRepository.findAll();
  }

  async createCategory(input: CreateBudgetCategoryInput): Promise<BudgetCategorySchema> {
    return await this.budgetCategoryRepository.insert(input);
  }

  async updateCategory(
    id: string,
    input: UpdateBudgetCategoryInput,
  ): Promise<BudgetCategorySchema> {
    const category = await this.budgetCategoryRepository.findById(id);
    if (!category) throw new BudgetCategoryNotFoundError();
    if (category.isSystem) throw new CannotModifySystemCategoryError();
    return await this.budgetCategoryRepository.update(id, input);
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.budgetCategoryRepository.findById(id);
    if (!category) throw new BudgetCategoryNotFoundError();
    if (category.isSystem) throw new CannotModifySystemCategoryError();
    await this.budgetCategoryRepository.delete(id);
  }
}

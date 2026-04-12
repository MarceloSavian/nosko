import { BudgetCategoryNotFoundError } from '../../../domain/errors/budget.js';
import type {
  BudgetCategorySchema,
  CreateBudgetCategoryInput,
  UpdateBudgetCategoryInput,
} from '../../../domain/models/budget/BudgetCategory.js';
import type { IAdminBudgetCategoryService } from '../../../domain/usecases/admin/IAdminBudgetCategoryService.js';
import type { IBudgetCategoryRepository } from '../../domain/budget/IBudgetCategoryRepository.js';

export class AdminBudgetCategoryService implements IAdminBudgetCategoryService {
  constructor(private readonly budgetCategoryRepository: IBudgetCategoryRepository) {}

  async listCategories(): Promise<BudgetCategorySchema[]> {
    return await this.budgetCategoryRepository.findAll();
  }

  async createSystemCategory(input: CreateBudgetCategoryInput): Promise<BudgetCategorySchema> {
    return await this.budgetCategoryRepository.insert({ ...input, isSystem: true });
  }

  async updateCategory(id: string, input: UpdateBudgetCategoryInput): Promise<BudgetCategorySchema> {
    const category = await this.budgetCategoryRepository.findById(id);
    if (!category) throw new BudgetCategoryNotFoundError();
    return await this.budgetCategoryRepository.update(id, input);
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.budgetCategoryRepository.findById(id);
    if (!category) throw new BudgetCategoryNotFoundError();
    await this.budgetCategoryRepository.delete(id);
  }
}

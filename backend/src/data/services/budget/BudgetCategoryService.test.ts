import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import {
  BudgetCategoryNotFoundError,
  CannotModifySystemCategoryError,
} from '../../../domain/errors/budget.js';
import { resetMock } from '../../../test/helpers/resetMock.js';
import { mockBudgetCategoryRepository } from '../../../test/mocks/MockBudgetCategoryRepository.js';
import { BudgetCategoryService } from './BudgetCategoryService.js';

describe('BudgetCategoryService', () => {
  const makeSut = () => {
    const sut = new BudgetCategoryService(mockBudgetCategoryRepository);
    return { sut };
  };

  const category = {
    id: 'cat-id',
    name: 'Food & Dining',
    icon: 'utensils',
    isSystem: false,
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  const systemCategory = { ...category, id: 'sys-id', isSystem: true };

  beforeEach(() => {
    mock.restoreAll();
    resetMock(mockBudgetCategoryRepository);
  });

  describe('listCategories()', () => {
    it('should return all categories', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetCategoryRepository, 'findAll', async () => [category]);

      const result = await sut.listCategories();

      assert.deepEqual(result, [category]);
    });
  });

  describe('createCategory()', () => {
    it('should create and return category', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetCategoryRepository, 'insert', async () => category);

      const result = await sut.createCategory({ name: 'Food & Dining' });

      assert.deepEqual(result, category);
    });
  });

  describe('updateCategory()', () => {
    it('should throw BudgetCategoryNotFoundError when not found', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetCategoryRepository, 'findById', async () => null);

      await assert.rejects(
        async () => sut.updateCategory('nonexistent', { name: 'New' }),
        new BudgetCategoryNotFoundError(),
      );
    });

    it('should throw CannotModifySystemCategoryError for system categories', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetCategoryRepository, 'findById', async () => systemCategory);

      await assert.rejects(
        async () => sut.updateCategory('sys-id', { name: 'New' }),
        new CannotModifySystemCategoryError(),
      );
    });
  });

  describe('deleteCategory()', () => {
    it('should delete the category', async () => {
      const { sut } = makeSut();
      mock.method(mockBudgetCategoryRepository, 'findById', async () => category);

      await sut.deleteCategory('cat-id');

      assert.equal(mockBudgetCategoryRepository.delete.mock.calls[0]?.arguments[0], 'cat-id');
    });
  });
});

import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import { UnexpectedError } from '@/domain/errors/auth';
import type { BudgetCategory } from '@/domain/models/budget/BudgetCategory';
import type {
  BudgetItem,
  BudgetPlanWithItems,
  BudgetSummary,
} from '@/domain/models/budget/BudgetPlan';
import { BudgetGateway } from './BudgetGateway';

const token = 'valid-token';

const mockCategory: BudgetCategory = {
  id: 'cat-1',
  name: 'Food',
  icon: 'restaurant',
  isSystem: false,
  createdAt: '2024-01-01T00:00:00.000Z',
};

const mockPlanWithItems: BudgetPlanWithItems = {
  plan: {
    id: 'plan-1',
    customerId: 'cust-1',
    partnershipId: null,
    yearMonth: '2024-01',
    currencyCode: 'USD',
    isJoint: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  items: [],
};

const mockItem: BudgetItem = {
  id: 'item-1',
  planId: 'plan-1',
  categoryId: 'cat-1',
  name: 'Rent',
  plannedAmount: 100000,
  direction: 'EXPENSE',
  type: 'FIXED',
  recurrence: 'PERMANENT',
  installmentTotal: null,
  installmentNumber: null,
  sourceItemId: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockSummary: BudgetSummary = {
  yearMonth: '2024-01',
  personalIncome: 500000,
  personalExpenses: 300000,
  jointExpenses: 100000,
  yourJointShare: 50000,
  freeAmount: 150000,
  personalItems: [],
  jointItems: [],
};

const authHeaders = { Authorization: `Bearer ${token}` };

describe('BudgetGateway', () => {
  const makeSut = () => {
    const httpClientSpy: IHttpClient = { request: vi.fn() };
    const getToken = vi.fn().mockReturnValue(token);
    const sut = new BudgetGateway(httpClientSpy, getToken);
    return { sut, httpClientSpy, getToken };
  };

  describe('auth headers', () => {
    it('should throw UnexpectedError when token is null', async () => {
      const httpClientSpy: IHttpClient = { request: vi.fn() };
      const getToken = vi.fn().mockReturnValue(null);
      const sut = new BudgetGateway(httpClientSpy, getToken);

      await expect(sut.loadCategories()).rejects.toThrow(UnexpectedError);
    });
  });

  describe('loadCategories()', () => {
    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: [mockCategory],
      });

      await sut.loadCategories();

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/budget-categories',
        method: 'get',
        headers: authHeaders,
      });
    });

    it('should return categories on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: [mockCategory],
      });

      const result = await sut.loadCategories();

      expect(result).toEqual([mockCategory]);
    });

    it('should throw UnexpectedError on non-200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.loadCategories()).rejects.toThrow(UnexpectedError);
    });
  });

  describe('createCategory()', () => {
    const input = { name: 'Food', icon: 'restaurant' };

    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 201,
        body: mockCategory,
      });

      await sut.createCategory(input);

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/budget-categories',
        method: 'post',
        body: input,
        headers: authHeaders,
      });
    });

    it('should return category on 201', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 201,
        body: mockCategory,
      });

      const result = await sut.createCategory(input);

      expect(result).toEqual(mockCategory);
    });

    it('should throw UnexpectedError on non-201', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 400,
        body: {},
      });

      await expect(sut.createCategory(input)).rejects.toThrow(UnexpectedError);
    });
  });

  describe('updateCategory()', () => {
    const input = { name: 'Groceries' };

    it('should call httpClient with correct URL and body', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: { ...mockCategory, name: 'Groceries' },
      });

      await sut.updateCategory('cat-1', input);

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/budget-categories/cat-1',
        method: 'put',
        body: input,
        headers: authHeaders,
      });
    });

    it('should return updated category on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: { ...mockCategory, name: 'Groceries' },
      });

      const result = await sut.updateCategory('cat-1', input);

      expect(result.name).toBe('Groceries');
    });

    it('should throw UnexpectedError on non-200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 404,
        body: {},
      });

      await expect(sut.updateCategory('cat-1', input)).rejects.toThrow(UnexpectedError);
    });
  });

  describe('deleteCategory()', () => {
    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 204,
        body: null,
      });

      await sut.deleteCategory('cat-1');

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/budget-categories/cat-1',
        method: 'delete',
        headers: authHeaders,
      });
    });

    it('should resolve on 204', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 204,
        body: null,
      });

      await expect(sut.deleteCategory('cat-1')).resolves.toBeUndefined();
    });

    it('should throw UnexpectedError on non-204', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.deleteCategory('cat-1')).rejects.toThrow(UnexpectedError);
    });
  });

  describe('loadPlan()', () => {
    it('should call httpClient with yearMonth query param', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: mockPlanWithItems,
      });

      await sut.loadPlan('2024-01');

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/budget-plans?yearMonth=2024-01',
        method: 'get',
        headers: authHeaders,
      });
    });

    it('should return plan on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: mockPlanWithItems,
      });

      const result = await sut.loadPlan('2024-01');

      expect(result).toEqual(mockPlanWithItems);
    });

    it('should return null when body is null on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: null,
      });

      const result = await sut.loadPlan('2024-01');

      expect(result).toBeNull();
    });

    it('should throw UnexpectedError on non-200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.loadPlan('2024-01')).rejects.toThrow(UnexpectedError);
    });
  });

  describe('createPlan()', () => {
    const input = { yearMonth: '2024-01', currencyCode: 'USD' };

    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 201,
        body: mockPlanWithItems,
      });

      await sut.createPlan(input);

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/budget-plans',
        method: 'post',
        body: input,
        headers: authHeaders,
      });
    });

    it('should return plan on 201', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 201,
        body: mockPlanWithItems,
      });

      const result = await sut.createPlan(input);

      expect(result).toEqual(mockPlanWithItems);
    });

    it('should throw UnexpectedError on non-201', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 400,
        body: {},
      });

      await expect(sut.createPlan(input)).rejects.toThrow(UnexpectedError);
    });
  });

  describe('deletePlan()', () => {
    it('should call httpClient with correct URL', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 204,
        body: null,
      });

      await sut.deletePlan('plan-1');

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/budget-plans/plan-1',
        method: 'delete',
        headers: authHeaders,
      });
    });

    it('should throw UnexpectedError on non-204', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.deletePlan('plan-1')).rejects.toThrow(UnexpectedError);
    });
  });

  describe('loadJointPlan()', () => {
    it('should call httpClient with partnership URL', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: mockPlanWithItems,
      });

      await sut.loadJointPlan('2024-01');

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/partnership/budget-plans?yearMonth=2024-01',
        method: 'get',
        headers: authHeaders,
      });
    });

    it('should return plan on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: mockPlanWithItems,
      });

      const result = await sut.loadJointPlan('2024-01');

      expect(result).toEqual(mockPlanWithItems);
    });

    it('should throw UnexpectedError on non-200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.loadJointPlan('2024-01')).rejects.toThrow(UnexpectedError);
    });
  });

  describe('createJointPlan()', () => {
    const input = { yearMonth: '2024-01', currencyCode: 'USD' };

    it('should call httpClient with partnership URL', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 201,
        body: mockPlanWithItems,
      });

      await sut.createJointPlan(input);

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/partnership/budget-plans',
        method: 'post',
        body: input,
        headers: authHeaders,
      });
    });

    it('should return plan on 201', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 201,
        body: mockPlanWithItems,
      });

      const result = await sut.createJointPlan(input);

      expect(result).toEqual(mockPlanWithItems);
    });

    it('should throw UnexpectedError on non-201', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 400,
        body: {},
      });

      await expect(sut.createJointPlan(input)).rejects.toThrow(UnexpectedError);
    });
  });

  describe('deleteJointPlan()', () => {
    it('should call httpClient with partnership URL', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 204,
        body: null,
      });

      await sut.deleteJointPlan('plan-1');

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/partnership/budget-plans/plan-1',
        method: 'delete',
        headers: authHeaders,
      });
    });

    it('should throw UnexpectedError on non-204', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.deleteJointPlan('plan-1')).rejects.toThrow(UnexpectedError);
    });
  });

  describe('addItem()', () => {
    const input = {
      categoryId: 'cat-1',
      name: 'Rent',
      plannedAmount: 100000,
      direction: 'EXPENSE' as const,
      type: 'FIXED' as const,
      recurrence: 'PERMANENT' as const,
    };

    it('should call httpClient with correct URL including planId', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 201,
        body: mockItem,
      });

      await sut.addItem('plan-1', input);

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/budget-plans/plan-1/items',
        method: 'post',
        body: input,
        headers: authHeaders,
      });
    });

    it('should return item on 201', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 201,
        body: mockItem,
      });

      const result = await sut.addItem('plan-1', input);

      expect(result).toEqual(mockItem);
    });

    it('should throw UnexpectedError on non-201', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 400,
        body: {},
      });

      await expect(sut.addItem('plan-1', input)).rejects.toThrow(UnexpectedError);
    });
  });

  describe('updateItem()', () => {
    const input = { name: 'Updated Rent' };

    it('should call httpClient with correct URL including planId and itemId', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: { ...mockItem, name: 'Updated Rent' },
      });

      await sut.updateItem('plan-1', 'item-1', input);

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/budget-plans/plan-1/items/item-1',
        method: 'put',
        body: input,
        headers: authHeaders,
      });
    });

    it('should return updated item on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: { ...mockItem, name: 'Updated Rent' },
      });

      const result = await sut.updateItem('plan-1', 'item-1', input);

      expect(result.name).toBe('Updated Rent');
    });

    it('should throw UnexpectedError on non-200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 404,
        body: {},
      });

      await expect(sut.updateItem('plan-1', 'item-1', input)).rejects.toThrow(UnexpectedError);
    });
  });

  describe('deleteItem()', () => {
    it('should call httpClient with correct URL including planId and itemId', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 204,
        body: null,
      });

      await sut.deleteItem('plan-1', 'item-1');

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/budget-plans/plan-1/items/item-1',
        method: 'delete',
        headers: authHeaders,
      });
    });

    it('should resolve on 204', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 204,
        body: null,
      });

      await expect(sut.deleteItem('plan-1', 'item-1')).resolves.toBeUndefined();
    });

    it('should throw UnexpectedError on non-204', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.deleteItem('plan-1', 'item-1')).rejects.toThrow(UnexpectedError);
    });
  });

  describe('loadSummary()', () => {
    it('should call httpClient with correct URL and yearMonth query param', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: mockSummary,
      });

      await sut.loadSummary('2024-01');

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/budget-plans/summary?yearMonth=2024-01',
        method: 'get',
        headers: authHeaders,
      });
    });

    it('should return summary on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: mockSummary,
      });

      const result = await sut.loadSummary('2024-01');

      expect(result).toEqual(mockSummary);
    });

    it('should throw UnexpectedError on non-200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.loadSummary('2024-01')).rejects.toThrow(UnexpectedError);
    });
  });
});

import { describe, expect, it, vi } from 'vitest';
import type { IBudgetGateway } from '@/data/protocols/budget/IBudgetGateway';
import type { BudgetCategory } from '@/domain/models/budget/BudgetCategory';
import type {
  AddBudgetItemInput,
  BudgetItem,
  BudgetPlanWithItems,
  BudgetSummary,
} from '@/domain/models/budget/BudgetPlan';
import { RemoteAddBudgetItem } from './RemoteAddBudgetItem';
import { RemoteCreateBudgetCategory } from './RemoteCreateBudgetCategory';
import { RemoteCreateBudgetPlan } from './RemoteCreateBudgetPlan';
import { RemoteCreateJointBudgetPlan } from './RemoteCreateJointBudgetPlan';
import { RemoteDeleteBudgetCategory } from './RemoteDeleteBudgetCategory';
import { RemoteDeleteBudgetItem } from './RemoteDeleteBudgetItem';
import { RemoteDeleteBudgetPlan } from './RemoteDeleteBudgetPlan';
import { RemoteDeleteJointBudgetPlan } from './RemoteDeleteJointBudgetPlan';
import { RemoteLoadBudgetCategories } from './RemoteLoadBudgetCategories';
import { RemoteLoadBudgetPlan } from './RemoteLoadBudgetPlan';
import { RemoteLoadBudgetSummary } from './RemoteLoadBudgetSummary';
import { RemoteLoadJointBudgetPlan } from './RemoteLoadJointBudgetPlan';
import { RemoteUpdateBudgetCategory } from './RemoteUpdateBudgetCategory';
import { RemoteUpdateBudgetItem } from './RemoteUpdateBudgetItem';

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

function makeGatewaySpy(): IBudgetGateway {
  return {
    loadCategories: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    loadPlan: vi.fn(),
    createPlan: vi.fn(),
    deletePlan: vi.fn(),
    loadJointPlan: vi.fn(),
    createJointPlan: vi.fn(),
    deleteJointPlan: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    loadSummary: vi.fn(),
  };
}

describe('RemoteLoadBudgetCategories', () => {
  const makeSut = () => {
    const gatewaySpy = makeGatewaySpy();
    const sut = new RemoteLoadBudgetCategories(gatewaySpy);
    return { sut, gatewaySpy };
  };

  it('should call gateway.loadCategories and return result', async () => {
    const { sut, gatewaySpy } = makeSut();
    vi.spyOn(gatewaySpy, 'loadCategories').mockResolvedValueOnce([mockCategory]);

    const result = await sut.execute();

    expect(gatewaySpy.loadCategories).toHaveBeenCalledOnce();
    expect(result).toEqual([mockCategory]);
  });

  it('should rethrow gateway errors', async () => {
    const { sut, gatewaySpy } = makeSut();
    vi.spyOn(gatewaySpy, 'loadCategories').mockRejectedValueOnce(new Error('fail'));

    await expect(sut.execute()).rejects.toThrow('fail');
  });
});

describe('RemoteCreateBudgetCategory', () => {
  const makeSut = () => {
    const gatewaySpy = makeGatewaySpy();
    const sut = new RemoteCreateBudgetCategory(gatewaySpy);
    return { sut, gatewaySpy };
  };

  it('should call gateway.createCategory with correct input', async () => {
    const { sut, gatewaySpy } = makeSut();
    const input = { name: 'Food', icon: 'restaurant' };
    vi.spyOn(gatewaySpy, 'createCategory').mockResolvedValueOnce(mockCategory);

    const result = await sut.execute(input);

    expect(gatewaySpy.createCategory).toHaveBeenCalledWith(input);
    expect(result).toEqual(mockCategory);
  });
});

describe('RemoteUpdateBudgetCategory', () => {
  const makeSut = () => {
    const gatewaySpy = makeGatewaySpy();
    const sut = new RemoteUpdateBudgetCategory(gatewaySpy);
    return { sut, gatewaySpy };
  };

  it('should call gateway.updateCategory with correct id and input', async () => {
    const { sut, gatewaySpy } = makeSut();
    const input = { name: 'Groceries' };
    vi.spyOn(gatewaySpy, 'updateCategory').mockResolvedValueOnce({
      ...mockCategory,
      name: 'Groceries',
    });

    const result = await sut.execute('cat-1', input);

    expect(gatewaySpy.updateCategory).toHaveBeenCalledWith('cat-1', input);
    expect(result.name).toBe('Groceries');
  });
});

describe('RemoteDeleteBudgetCategory', () => {
  const makeSut = () => {
    const gatewaySpy = makeGatewaySpy();
    const sut = new RemoteDeleteBudgetCategory(gatewaySpy);
    return { sut, gatewaySpy };
  };

  it('should call gateway.deleteCategory with correct id', async () => {
    const { sut, gatewaySpy } = makeSut();
    vi.spyOn(gatewaySpy, 'deleteCategory').mockResolvedValueOnce(undefined);

    await sut.execute('cat-1');

    expect(gatewaySpy.deleteCategory).toHaveBeenCalledWith('cat-1');
  });
});

describe('RemoteLoadBudgetPlan', () => {
  const makeSut = () => {
    const gatewaySpy = makeGatewaySpy();
    const sut = new RemoteLoadBudgetPlan(gatewaySpy);
    return { sut, gatewaySpy };
  };

  it('should call gateway.loadPlan with yearMonth and return result', async () => {
    const { sut, gatewaySpy } = makeSut();
    vi.spyOn(gatewaySpy, 'loadPlan').mockResolvedValueOnce(mockPlanWithItems);

    const result = await sut.execute('2024-01');

    expect(gatewaySpy.loadPlan).toHaveBeenCalledWith('2024-01');
    expect(result).toEqual(mockPlanWithItems);
  });

  it('should return null when gateway returns null', async () => {
    const { sut, gatewaySpy } = makeSut();
    vi.spyOn(gatewaySpy, 'loadPlan').mockResolvedValueOnce(null);

    const result = await sut.execute('2024-01');

    expect(result).toBeNull();
  });
});

describe('RemoteCreateBudgetPlan', () => {
  const makeSut = () => {
    const gatewaySpy = makeGatewaySpy();
    const sut = new RemoteCreateBudgetPlan(gatewaySpy);
    return { sut, gatewaySpy };
  };

  it('should call gateway.createPlan with correct input', async () => {
    const { sut, gatewaySpy } = makeSut();
    const input = { yearMonth: '2024-01', currencyCode: 'USD' };
    vi.spyOn(gatewaySpy, 'createPlan').mockResolvedValueOnce(mockPlanWithItems);

    const result = await sut.execute(input);

    expect(gatewaySpy.createPlan).toHaveBeenCalledWith(input);
    expect(result).toEqual(mockPlanWithItems);
  });
});

describe('RemoteDeleteBudgetPlan', () => {
  const makeSut = () => {
    const gatewaySpy = makeGatewaySpy();
    const sut = new RemoteDeleteBudgetPlan(gatewaySpy);
    return { sut, gatewaySpy };
  };

  it('should call gateway.deletePlan with correct id', async () => {
    const { sut, gatewaySpy } = makeSut();
    vi.spyOn(gatewaySpy, 'deletePlan').mockResolvedValueOnce(undefined);

    await sut.execute('plan-1');

    expect(gatewaySpy.deletePlan).toHaveBeenCalledWith('plan-1');
  });
});

describe('RemoteLoadJointBudgetPlan', () => {
  const makeSut = () => {
    const gatewaySpy = makeGatewaySpy();
    const sut = new RemoteLoadJointBudgetPlan(gatewaySpy);
    return { sut, gatewaySpy };
  };

  it('should call gateway.loadJointPlan with yearMonth', async () => {
    const { sut, gatewaySpy } = makeSut();
    vi.spyOn(gatewaySpy, 'loadJointPlan').mockResolvedValueOnce(mockPlanWithItems);

    const result = await sut.execute('2024-01');

    expect(gatewaySpy.loadJointPlan).toHaveBeenCalledWith('2024-01');
    expect(result).toEqual(mockPlanWithItems);
  });
});

describe('RemoteCreateJointBudgetPlan', () => {
  const makeSut = () => {
    const gatewaySpy = makeGatewaySpy();
    const sut = new RemoteCreateJointBudgetPlan(gatewaySpy);
    return { sut, gatewaySpy };
  };

  it('should call gateway.createJointPlan with correct input', async () => {
    const { sut, gatewaySpy } = makeSut();
    const input = { yearMonth: '2024-01', currencyCode: 'USD' };
    vi.spyOn(gatewaySpy, 'createJointPlan').mockResolvedValueOnce(mockPlanWithItems);

    const result = await sut.execute(input);

    expect(gatewaySpy.createJointPlan).toHaveBeenCalledWith(input);
    expect(result).toEqual(mockPlanWithItems);
  });
});

describe('RemoteDeleteJointBudgetPlan', () => {
  const makeSut = () => {
    const gatewaySpy = makeGatewaySpy();
    const sut = new RemoteDeleteJointBudgetPlan(gatewaySpy);
    return { sut, gatewaySpy };
  };

  it('should call gateway.deleteJointPlan with correct id', async () => {
    const { sut, gatewaySpy } = makeSut();
    vi.spyOn(gatewaySpy, 'deleteJointPlan').mockResolvedValueOnce(undefined);

    await sut.execute('plan-1');

    expect(gatewaySpy.deleteJointPlan).toHaveBeenCalledWith('plan-1');
  });
});

describe('RemoteAddBudgetItem', () => {
  const makeSut = () => {
    const gatewaySpy = makeGatewaySpy();
    const sut = new RemoteAddBudgetItem(gatewaySpy);
    return { sut, gatewaySpy };
  };

  it('should call gateway.addItem with planId and input', async () => {
    const { sut, gatewaySpy } = makeSut();
    const input: AddBudgetItemInput = {
      categoryId: 'cat-1',
      name: 'Rent',
      plannedAmount: 100000,
      direction: 'EXPENSE',
      type: 'FIXED',
      recurrence: 'PERMANENT',
    };
    vi.spyOn(gatewaySpy, 'addItem').mockResolvedValueOnce(mockItem);

    const result = await sut.execute('plan-1', input);

    expect(gatewaySpy.addItem).toHaveBeenCalledWith('plan-1', input);
    expect(result).toEqual(mockItem);
  });
});

describe('RemoteUpdateBudgetItem', () => {
  const makeSut = () => {
    const gatewaySpy = makeGatewaySpy();
    const sut = new RemoteUpdateBudgetItem(gatewaySpy);
    return { sut, gatewaySpy };
  };

  it('should call gateway.updateItem with planId, itemId, and input', async () => {
    const { sut, gatewaySpy } = makeSut();
    const input = { name: 'Updated Rent' };
    vi.spyOn(gatewaySpy, 'updateItem').mockResolvedValueOnce({ ...mockItem, name: 'Updated Rent' });

    const result = await sut.execute('plan-1', 'item-1', input);

    expect(gatewaySpy.updateItem).toHaveBeenCalledWith('plan-1', 'item-1', input);
    expect(result.name).toBe('Updated Rent');
  });
});

describe('RemoteDeleteBudgetItem', () => {
  const makeSut = () => {
    const gatewaySpy = makeGatewaySpy();
    const sut = new RemoteDeleteBudgetItem(gatewaySpy);
    return { sut, gatewaySpy };
  };

  it('should call gateway.deleteItem with planId and itemId', async () => {
    const { sut, gatewaySpy } = makeSut();
    vi.spyOn(gatewaySpy, 'deleteItem').mockResolvedValueOnce(undefined);

    await sut.execute('plan-1', 'item-1');

    expect(gatewaySpy.deleteItem).toHaveBeenCalledWith('plan-1', 'item-1');
  });
});

describe('RemoteLoadBudgetSummary', () => {
  const makeSut = () => {
    const gatewaySpy = makeGatewaySpy();
    const sut = new RemoteLoadBudgetSummary(gatewaySpy);
    return { sut, gatewaySpy };
  };

  it('should call gateway.loadSummary with yearMonth and return result', async () => {
    const { sut, gatewaySpy } = makeSut();
    vi.spyOn(gatewaySpy, 'loadSummary').mockResolvedValueOnce(mockSummary);

    const result = await sut.execute('2024-01');

    expect(gatewaySpy.loadSummary).toHaveBeenCalledWith('2024-01');
    expect(result).toEqual(mockSummary);
  });
});

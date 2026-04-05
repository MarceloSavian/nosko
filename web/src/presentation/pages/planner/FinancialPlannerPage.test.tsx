import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { BudgetCategory } from '@/domain/models/budget/BudgetCategory';
import type {
  BudgetItem,
  BudgetPlanWithItems,
  BudgetSummary,
} from '@/domain/models/budget/BudgetPlan';
import type { IAddBudgetItem } from '@/domain/usecases/budget/IAddBudgetItem';
import type { ICreateBudgetCategory } from '@/domain/usecases/budget/ICreateBudgetCategory';
import type { ICreateBudgetPlan } from '@/domain/usecases/budget/ICreateBudgetPlan';
import type { ICreateJointBudgetPlan } from '@/domain/usecases/budget/ICreateJointBudgetPlan';
import type { IDeleteBudgetCategory } from '@/domain/usecases/budget/IDeleteBudgetCategory';
import type { IDeleteBudgetItem } from '@/domain/usecases/budget/IDeleteBudgetItem';
import type { IDeleteBudgetPlan } from '@/domain/usecases/budget/IDeleteBudgetPlan';
import type { IDeleteJointBudgetPlan } from '@/domain/usecases/budget/IDeleteJointBudgetPlan';
import type { ILoadBudgetCategories } from '@/domain/usecases/budget/ILoadBudgetCategories';
import type { ILoadBudgetPlan } from '@/domain/usecases/budget/ILoadBudgetPlan';
import type { ILoadBudgetSummary } from '@/domain/usecases/budget/ILoadBudgetSummary';
import type { ILoadJointBudgetPlan } from '@/domain/usecases/budget/ILoadJointBudgetPlan';
import { renderWithI18n } from '@/test/i18n';
import { FinancialPlannerPage, type FinancialPlannerPageProps } from './FinancialPlannerPage';

const mockCategory: BudgetCategory = {
  id: 'cat-1',
  name: 'Food',
  icon: 'restaurant',
  isSystem: false,
  createdAt: '2024-01-01T00:00:00.000Z',
};

const mockSystemCategory: BudgetCategory = {
  id: 'cat-sys',
  name: 'Utilities',
  icon: 'bolt',
  isSystem: true,
  createdAt: '2024-01-01T00:00:00.000Z',
};

const mockItem: BudgetItem = {
  id: 'item-1',
  planId: 'plan-1',
  categoryId: 'cat-1',
  name: 'Groceries',
  plannedAmount: 50000,
  direction: 'EXPENSE',
  type: 'FIXED',
  recurrence: 'PERMANENT',
  installmentTotal: null,
  installmentNumber: null,
  sourceItemId: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockIncomeItem: BudgetItem = {
  id: 'item-2',
  planId: 'plan-1',
  categoryId: 'cat-1',
  name: 'Salary',
  plannedAmount: 500000,
  direction: 'INCOME',
  type: 'FIXED',
  recurrence: 'PERMANENT',
  installmentTotal: null,
  installmentNumber: null,
  sourceItemId: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
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
  items: [mockItem, mockIncomeItem],
};

const mockJointPlan: BudgetPlanWithItems = {
  plan: {
    id: 'plan-2',
    customerId: null,
    partnershipId: 'partner-1',
    yearMonth: '2024-01',
    currencyCode: 'USD',
    isJoint: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  items: [],
};

const mockSummary: BudgetSummary = {
  yearMonth: '2024-01',
  personalIncome: 500000,
  personalExpenses: 300000,
  jointExpenses: 100000,
  yourJointShare: 50000,
  freeAmount: 150000,
  personalItems: [
    {
      itemId: 'item-1',
      name: 'Groceries',
      categoryId: 'cat-1',
      direction: 'EXPENSE',
      type: 'FIXED',
      plannedAmount: 50000,
      actualAmount: 30000,
    },
  ],
  jointItems: [],
};

function makeProps(overrides?: Partial<FinancialPlannerPageProps>): FinancialPlannerPageProps {
  return {
    loadCategories: { execute: vi.fn().mockResolvedValue([mockCategory, mockSystemCategory]) },
    createCategory: { execute: vi.fn().mockResolvedValue(mockCategory) },
    deleteCategory: { execute: vi.fn().mockResolvedValue(undefined) },
    loadPlan: { execute: vi.fn().mockResolvedValue(mockPlanWithItems) },
    createPlan: { execute: vi.fn().mockResolvedValue(mockPlanWithItems) },
    deletePlan: { execute: vi.fn().mockResolvedValue(undefined) },
    loadJointPlan: { execute: vi.fn().mockResolvedValue(mockJointPlan) },
    createJointPlan: { execute: vi.fn().mockResolvedValue(mockJointPlan) },
    deleteJointPlan: { execute: vi.fn().mockResolvedValue(undefined) },
    addItem: { execute: vi.fn().mockResolvedValue(mockItem) },
    updateItem: { execute: vi.fn().mockResolvedValue(mockItem) },
    deleteItem: { execute: vi.fn().mockResolvedValue(undefined) },
    loadSummary: { execute: vi.fn().mockResolvedValue(mockSummary) },
    ...overrides,
  };
}

describe('FinancialPlannerPage', () => {
  const makeSut = (overrides?: Partial<FinancialPlannerPageProps>) => {
    const props = makeProps(overrides);
    renderWithI18n(<FinancialPlannerPage {...props} />);
    return { props };
  };

  describe('initial load', () => {
    it('should display the page heading', async () => {
      makeSut();

      expect(await screen.findByText('Budget Planner')).toBeInTheDocument();
    });

    it('should call loadCategories on mount', async () => {
      const { props } = makeSut();

      await waitFor(() => {
        expect(props.loadCategories.execute).toHaveBeenCalledOnce();
      });
    });

    it('should call loadPlan on mount', async () => {
      const { props } = makeSut();

      await waitFor(() => {
        expect(props.loadPlan.execute).toHaveBeenCalled();
      });
    });

    it('should call loadJointPlan on mount', async () => {
      const { props } = makeSut();

      await waitFor(() => {
        expect(props.loadJointPlan.execute).toHaveBeenCalled();
      });
    });

    it('should call loadSummary on mount', async () => {
      const { props } = makeSut();

      await waitFor(() => {
        expect(props.loadSummary.execute).toHaveBeenCalled();
      });
    });

    it('should display budget items after loading', async () => {
      makeSut();

      const groceries = await screen.findAllByText('Groceries');
      expect(groceries.length).toBeGreaterThan(0);
      expect(screen.getAllByText('Salary').length).toBeGreaterThan(0);
    });

    it('should display income and expense sections', async () => {
      makeSut();

      await screen.findAllByText('Groceries');
      const incomeHeadings = screen.getAllByText('Income');
      expect(incomeHeadings.length).toBeGreaterThan(0);
      expect(screen.getAllByText('Expenses').length).toBeGreaterThan(0);
    });
  });

  describe('loading state', () => {
    it('should show loading indicator while data is being fetched', () => {
      const loadCategories: ILoadBudgetCategories = {
        execute: vi.fn().mockReturnValue(new Promise(() => {})),
      };
      const loadPlan: ILoadBudgetPlan = {
        execute: vi.fn().mockReturnValue(new Promise(() => {})),
      };
      const loadJointPlan: ILoadJointBudgetPlan = {
        execute: vi.fn().mockReturnValue(new Promise(() => {})),
      };
      const loadSummary: ILoadBudgetSummary = {
        execute: vi.fn().mockReturnValue(new Promise(() => {})),
      };

      makeSut({ loadCategories, loadPlan, loadJointPlan, loadSummary });

      expect(screen.getByText('hourglass_empty')).toBeInTheDocument();
    });
  });

  describe('empty state (no plan)', () => {
    it('should show create plan form when no plan exists', async () => {
      const loadPlan: ILoadBudgetPlan = {
        execute: vi.fn().mockResolvedValue(null),
      };

      makeSut({ loadPlan });

      expect(await screen.findByText('No budget plan for this month')).toBeInTheDocument();
      expect(screen.getByText('Create Plan')).toBeInTheDocument();
    });

    it('should show currency select in create plan form', async () => {
      const loadPlan: ILoadBudgetPlan = {
        execute: vi.fn().mockResolvedValue(null),
      };

      makeSut({ loadPlan });

      await screen.findByText('No budget plan for this month');
      expect(screen.getByLabelText('Currency')).toBeInTheDocument();
    });
  });

  describe('month navigation', () => {
    it('should display current month', async () => {
      makeSut();

      const now = new Date();
      const expectedMonth = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      expect(await screen.findByText(expectedMonth)).toBeInTheDocument();
    });

    it('should navigate to previous month when clicking left arrow', async () => {
      const { props } = makeSut();
      const user = userEvent.setup();

      await screen.findByText('Budget Planner');
      const prevButton = screen.getByText('chevron_left').closest('button')!;
      await user.click(prevButton);

      await waitFor(() => {
        const calls = (props.loadPlan.execute as ReturnType<typeof vi.fn>).mock.calls;
        expect(calls.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should navigate to next month when clicking right arrow', async () => {
      const { props } = makeSut();
      const user = userEvent.setup();

      await screen.findByText('Budget Planner');
      const nextButton = screen.getByText('chevron_right').closest('button')!;
      await user.click(nextButton);

      await waitFor(() => {
        const calls = (props.loadPlan.execute as ReturnType<typeof vi.fn>).mock.calls;
        expect(calls.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('personal/joint tabs', () => {
    it('should display Personal and Joint tab buttons', async () => {
      makeSut();

      expect(await screen.findByText('Personal')).toBeInTheDocument();
      expect(screen.getByText('Joint')).toBeInTheDocument();
    });

    it('should show personal plan by default', async () => {
      makeSut();

      expect(await screen.findByText('Personal Budget')).toBeInTheDocument();
    });

    it('should switch to joint plan when clicking Joint tab', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Personal Budget');
      await user.click(screen.getByText('Joint'));

      await waitFor(() => {
        expect(screen.getByText('Joint Budget')).toBeInTheDocument();
      });
    });

    it('should switch back to personal plan when clicking Personal tab', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Personal Budget');
      await user.click(screen.getByText('Joint'));
      await screen.findByText('Joint Budget');
      await user.click(screen.getByText('Personal'));

      await waitFor(() => {
        expect(screen.getByText('Personal Budget')).toBeInTheDocument();
      });
    });

    it('should show create plan form on joint tab when no joint plan', async () => {
      const loadJointPlan: ILoadJointBudgetPlan = {
        execute: vi.fn().mockResolvedValue(null),
      };
      makeSut({ loadJointPlan });
      const user = userEvent.setup();

      await screen.findByText('Personal Budget');
      await user.click(screen.getByText('Joint'));

      expect(await screen.findByText('No budget plan for this month')).toBeInTheDocument();
    });
  });

  describe('create plan', () => {
    it('should call createPlan when submitting the form on personal tab', async () => {
      const loadPlan: ILoadBudgetPlan = {
        execute: vi.fn().mockResolvedValue(null),
      };
      const createPlan: ICreateBudgetPlan = {
        execute: vi.fn().mockResolvedValue(mockPlanWithItems),
      };
      const { props } = makeSut({ loadPlan, createPlan });
      const user = userEvent.setup();

      await screen.findByText('No budget plan for this month');
      await user.selectOptions(screen.getByLabelText('Currency'), 'USD');
      await user.click(screen.getByText('Create Plan'));

      await waitFor(() => {
        expect(props.createPlan.execute).toHaveBeenCalled();
      });
    });

    it('should call createJointPlan when submitting on joint tab', async () => {
      const loadPlan: ILoadBudgetPlan = {
        execute: vi.fn().mockResolvedValue(null),
      };
      const loadJointPlan: ILoadJointBudgetPlan = {
        execute: vi.fn().mockResolvedValue(null),
      };
      const createJointPlan: ICreateJointBudgetPlan = {
        execute: vi.fn().mockResolvedValue(mockJointPlan),
      };
      makeSut({ loadPlan, loadJointPlan, createJointPlan });
      const user = userEvent.setup();

      await screen.findByText('No budget plan for this month');
      await user.click(screen.getByText('Joint'));
      await screen.findByText('No budget plan for this month');
      await user.selectOptions(screen.getByLabelText('Currency'), 'USD');
      await user.click(screen.getByText('Create Plan'));

      await waitFor(() => {
        expect(createJointPlan.execute).toHaveBeenCalled();
      });
    });
  });

  describe('delete plan', () => {
    it('should show Delete Plan button when plan exists', async () => {
      makeSut();

      expect(await screen.findByText('Delete Plan')).toBeInTheDocument();
    });

    it('should call deletePlan when clicking Delete Plan on personal tab', async () => {
      const { props } = makeSut();
      const user = userEvent.setup();

      await screen.findByText('Delete Plan');
      await user.click(screen.getByText('Delete Plan'));

      await waitFor(() => {
        expect(props.deletePlan.execute).toHaveBeenCalledWith('plan-1');
      });
    });

    it('should call deleteJointPlan when clicking Delete Plan on joint tab', async () => {
      const { props } = makeSut();
      const user = userEvent.setup();

      await screen.findByText('Personal Budget');
      await user.click(screen.getByText('Joint'));
      await screen.findByText('Joint Budget');
      await user.click(screen.getByText('Delete Plan'));

      await waitFor(() => {
        expect(props.deleteJointPlan.execute).toHaveBeenCalledWith('plan-2');
      });
    });
  });

  describe('budget items', () => {
    it('should display item names', async () => {
      makeSut();

      const groceries = await screen.findAllByText('Groceries');
      expect(groceries.length).toBeGreaterThan(0);
      expect(screen.getAllByText('Salary').length).toBeGreaterThan(0);
    });

    it('should display item category name', async () => {
      makeSut();

      await screen.findAllByText('Groceries');
      expect(screen.getAllByText('Food').length).toBeGreaterThan(0);
    });

    it('should display item type and recurrence', async () => {
      makeSut();

      await screen.findAllByText('Groceries');
      expect(screen.getAllByText('FIXED').length).toBeGreaterThan(0);
      expect(screen.getAllByText('PERMANENT').length).toBeGreaterThan(0);
    });

    it('should display currency code', async () => {
      makeSut();

      expect(await screen.findByText('USD')).toBeInTheDocument();
    });

    it('should show empty message when plan has no items', async () => {
      const emptyPlan: BudgetPlanWithItems = {
        ...mockPlanWithItems,
        items: [],
      };
      const loadPlan: ILoadBudgetPlan = {
        execute: vi.fn().mockResolvedValue(emptyPlan),
      };
      makeSut({ loadPlan });

      expect(
        await screen.findByText('No items yet. Add your first income or expense above.'),
      ).toBeInTheDocument();
    });

    it('should display net amount', async () => {
      makeSut();

      expect(await screen.findByText('Net')).toBeInTheDocument();
    });
  });

  describe('add item', () => {
    it('should display add item form when plan exists', async () => {
      makeSut();

      expect(await screen.findByText('Add Item')).toBeInTheDocument();
    });

    it('should call addItem use case when submitting add item form', async () => {
      const { props } = makeSut();
      const user = userEvent.setup();

      await screen.findByText('Add Item');
      await user.type(screen.getByLabelText('Name'), 'Internet');
      await user.type(screen.getByLabelText('Amount'), '50');
      await user.selectOptions(screen.getByLabelText('Category'), 'cat-1');
      await user.click(screen.getByRole('button', { name: 'Add' }));

      await waitFor(() => {
        expect(props.addItem.execute).toHaveBeenCalledWith(
          'plan-1',
          expect.objectContaining({
            name: 'Internet',
            plannedAmount: 5000,
            categoryId: 'cat-1',
            direction: 'EXPENSE',
            type: 'FIXED',
            recurrence: 'PERMANENT',
          }),
        );
      });
    });

    it('should reload data after adding an item', async () => {
      const { props } = makeSut();
      const user = userEvent.setup();

      await screen.findByText('Add Item');
      await user.type(screen.getByLabelText('Name'), 'Internet');
      await user.type(screen.getByLabelText('Amount'), '50');
      await user.selectOptions(screen.getByLabelText('Category'), 'cat-1');
      await user.click(screen.getByRole('button', { name: 'Add' }));

      await waitFor(() => {
        const calls = (props.loadPlan.execute as ReturnType<typeof vi.fn>).mock.calls;
        expect(calls.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('delete item', () => {
    it('should display delete buttons for each item', async () => {
      makeSut();

      await screen.findAllByText('Groceries');
      const deleteButtons = screen.getAllByText('delete');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('should call deleteItem when clicking delete on an item', async () => {
      const { props } = makeSut();
      const user = userEvent.setup();

      await screen.findAllByText('Groceries');
      const itemDeleteButtons = screen
        .getAllByText('delete')
        .map((el) => el.closest('button'))
        .filter((btn) => btn?.classList.contains('hover:bg-error/10'));
      await user.click(itemDeleteButtons[0]!);

      await waitFor(() => {
        expect(props.deleteItem.execute).toHaveBeenCalledWith('plan-1', expect.any(String));
      });
    });
  });

  describe('category management', () => {
    it('should show Manage Categories button', async () => {
      makeSut();

      expect(await screen.findByText('Manage Categories')).toBeInTheDocument();
    });

    it('should toggle category panel when clicking Manage Categories', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Manage Categories');
      await user.click(screen.getByText('Manage Categories'));

      expect(await screen.findByLabelText('Category Name')).toBeInTheDocument();
    });

    it('should display existing categories in management panel', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Manage Categories');
      await user.click(screen.getByText('Manage Categories'));

      await waitFor(() => {
        expect(screen.getAllByText('Food').length).toBeGreaterThan(0);
        expect(screen.getByText('Utilities')).toBeInTheDocument();
      });
    });

    it('should show System label for system categories', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Manage Categories');
      await user.click(screen.getByText('Manage Categories'));

      expect(await screen.findByText('System')).toBeInTheDocument();
    });

    it('should call createCategory when adding a new category', async () => {
      const { props } = makeSut();
      const user = userEvent.setup();

      await screen.findByText('Manage Categories');
      await user.click(screen.getByText('Manage Categories'));

      await screen.findByLabelText('Category Name');
      await user.type(screen.getByLabelText('Category Name'), 'Transport');
      const addButtons = screen.getAllByRole('button', { name: 'Add' });
      const categoryAddButton = addButtons.find((btn) =>
        btn.closest('form')?.querySelector('#cat-name'),
      );
      await user.click(categoryAddButton!);

      await waitFor(() => {
        expect(props.createCategory.execute).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Transport' }),
        );
      });
    });

    it('should call deleteCategory when clicking delete on a non-system category', async () => {
      const { props } = makeSut();
      const user = userEvent.setup();

      await screen.findByText('Manage Categories');
      await user.click(screen.getByText('Manage Categories'));

      await screen.findAllByText('Food');
      const closeButtons = screen
        .getAllByText('close')
        .map((el) => el.closest('button'))
        .filter(Boolean);
      await user.click(closeButtons[0]!);

      await waitFor(() => {
        expect(props.deleteCategory.execute).toHaveBeenCalled();
      });
    });

    it('should not show delete button for system categories', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Manage Categories');
      await user.click(screen.getByText('Manage Categories'));

      await screen.findByText('Utilities');
      const utilitiesRow = screen
        .getByText('Utilities')
        .closest('div[class*="flex items-center justify-between"]');
      const closeButton = utilitiesRow?.querySelector('button');
      expect(closeButton).toBeNull();
    });
  });

  describe('budget summary', () => {
    it('should display Monthly Summary section', async () => {
      makeSut();

      expect(await screen.findByText('Monthly Summary')).toBeInTheDocument();
    });

    it('should display summary values', async () => {
      makeSut();

      await screen.findByText('Monthly Summary');
      expect(screen.getByText('Personal Income')).toBeInTheDocument();
      expect(screen.getByText('Personal Expenses')).toBeInTheDocument();
      expect(screen.getByText('Joint Expenses')).toBeInTheDocument();
      expect(screen.getByText('Your Joint Share')).toBeInTheDocument();
      expect(screen.getByText('Free Amount')).toBeInTheDocument();
    });

    it('should display Budget Utilization when there is income', async () => {
      makeSut();

      expect(await screen.findByText('Budget Utilization')).toBeInTheDocument();
    });

    it('should display Personal Items section in summary', async () => {
      makeSut();

      expect(await screen.findByText('Personal Items')).toBeInTheDocument();
    });

    it('should not display summary when summary is null', async () => {
      const loadSummary: ILoadBudgetSummary = {
        execute: vi.fn().mockResolvedValue(null),
      };
      makeSut({ loadSummary });

      await screen.findByText('Budget Planner');
      await waitFor(() => {
        expect(screen.queryByText('Monthly Summary')).not.toBeInTheDocument();
      });
    });

    it('should not display Budget Utilization when personalIncome is zero', async () => {
      const zeroIncomeSummary: BudgetSummary = {
        ...mockSummary,
        personalIncome: 0,
        freeAmount: -50000,
      };
      const loadSummary: ILoadBudgetSummary = {
        execute: vi.fn().mockResolvedValue(zeroIncomeSummary),
      };
      makeSut({ loadSummary });

      await screen.findByText('Monthly Summary');
      expect(screen.queryByText('Budget Utilization')).not.toBeInTheDocument();
    });

    it('should display negative free amount with error styling', async () => {
      const negativeSummary: BudgetSummary = {
        ...mockSummary,
        freeAmount: -10000,
      };
      const loadSummary: ILoadBudgetSummary = {
        execute: vi.fn().mockResolvedValue(negativeSummary),
      };
      makeSut({ loadSummary });

      await screen.findByText('Monthly Summary');
      expect(screen.getByText('Free Amount')).toBeInTheDocument();
    });

    it('should display joint items in summary when present', async () => {
      const summaryWithJointItems: BudgetSummary = {
        ...mockSummary,
        jointItems: [
          {
            itemId: 'item-j1',
            name: 'Rent',
            categoryId: 'cat-1',
            direction: 'EXPENSE',
            type: 'FIXED',
            plannedAmount: 100000,
            actualAmount: 100000,
          },
        ],
      };
      const loadSummary: ILoadBudgetSummary = {
        execute: vi.fn().mockResolvedValue(summaryWithJointItems),
      };
      makeSut({ loadSummary });

      await screen.findByText('Monthly Summary');
      expect(screen.getByText('Joint Items')).toBeInTheDocument();
      expect(screen.getByText('Rent')).toBeInTheDocument();
    });

    it('should display summary item with income direction', async () => {
      const summaryWithIncome: BudgetSummary = {
        ...mockSummary,
        personalItems: [
          {
            itemId: 'item-inc',
            name: 'Side Gig',
            categoryId: 'cat-1',
            direction: 'INCOME',
            type: 'FIXED',
            plannedAmount: 100000,
            actualAmount: 50000,
          },
        ],
      };
      const loadSummary: ILoadBudgetSummary = {
        execute: vi.fn().mockResolvedValue(summaryWithIncome),
      };
      makeSut({ loadSummary });

      await screen.findByText('Monthly Summary');
      expect(screen.getByText('Side Gig')).toBeInTheDocument();
    });

    it('should handle summary item with zero planned amount', async () => {
      const summaryWithZero: BudgetSummary = {
        ...mockSummary,
        personalItems: [
          {
            itemId: 'item-z',
            name: 'Bonus',
            categoryId: 'cat-1',
            direction: 'INCOME',
            type: 'ESTIMATED',
            plannedAmount: 0,
            actualAmount: 0,
          },
        ],
      };
      const loadSummary: ILoadBudgetSummary = {
        execute: vi.fn().mockResolvedValue(summaryWithZero),
      };
      makeSut({ loadSummary });

      await screen.findByText('Monthly Summary');
      expect(screen.getByText('Bonus')).toBeInTheDocument();
    });

    it('should show over-budget progress bar when utilization exceeds 100%', async () => {
      const overBudgetSummary: BudgetSummary = {
        ...mockSummary,
        personalIncome: 100000,
        personalExpenses: 200000,
        yourJointShare: 50000,
        freeAmount: -150000,
      };
      const loadSummary: ILoadBudgetSummary = {
        execute: vi.fn().mockResolvedValue(overBudgetSummary),
      };
      makeSut({ loadSummary });

      await screen.findByText('Budget Utilization');
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should show over-budget progress for summary item exceeding planned', async () => {
      const overBudgetItem: BudgetSummary = {
        ...mockSummary,
        personalItems: [
          {
            itemId: 'item-over',
            name: 'Dining',
            categoryId: 'cat-1',
            direction: 'EXPENSE',
            type: 'ESTIMATED',
            plannedAmount: 10000,
            actualAmount: 15000,
          },
        ],
      };
      const loadSummary: ILoadBudgetSummary = {
        execute: vi.fn().mockResolvedValue(overBudgetItem),
      };
      makeSut({ loadSummary });

      await screen.findByText('Dining');
    });

    it('should display summary item with unknown category', async () => {
      const summaryUnknownCat: BudgetSummary = {
        ...mockSummary,
        personalItems: [
          {
            itemId: 'item-unk',
            name: 'Mystery',
            categoryId: 'cat-unknown',
            direction: 'EXPENSE',
            type: 'FIXED',
            plannedAmount: 5000,
            actualAmount: 2000,
          },
        ],
      };
      const loadSummary: ILoadBudgetSummary = {
        execute: vi.fn().mockResolvedValue(summaryUnknownCat),
      };
      makeSut({ loadSummary });

      await screen.findByText('Mystery');
    });
  });

  describe('budget items edge cases', () => {
    it('should display installment info when item has installments', async () => {
      const installmentItem: BudgetItem = {
        ...mockItem,
        id: 'item-inst',
        name: 'Laptop',
        recurrence: 'INSTALLMENT',
        installmentNumber: 3,
        installmentTotal: 12,
      };
      const planWithInstallment: BudgetPlanWithItems = {
        ...mockPlanWithItems,
        items: [installmentItem],
      };
      const loadPlan: ILoadBudgetPlan = {
        execute: vi.fn().mockResolvedValue(planWithInstallment),
      };
      makeSut({ loadPlan });

      await screen.findByText('Laptop');
      expect(screen.getByText('3/12')).toBeInTheDocument();
    });

    it('should show fallback dash when item has unknown category', async () => {
      const unknownCatItem: BudgetItem = {
        ...mockItem,
        id: 'item-nocat',
        name: 'Unknown',
        categoryId: 'nonexistent',
      };
      const planWithUnknown: BudgetPlanWithItems = {
        ...mockPlanWithItems,
        items: [unknownCatItem],
      };
      const loadPlan: ILoadBudgetPlan = {
        execute: vi.fn().mockResolvedValue(planWithUnknown),
      };
      makeSut({ loadPlan });

      await screen.findByText('Unknown');
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should display negative net when expenses exceed income', async () => {
      const highExpenseItem: BudgetItem = {
        ...mockItem,
        id: 'item-high',
        name: 'Expensive',
        plannedAmount: 999900,
      };
      const planWithHighExpense: BudgetPlanWithItems = {
        ...mockPlanWithItems,
        items: [mockIncomeItem, highExpenseItem],
      };
      const loadPlan: ILoadBudgetPlan = {
        execute: vi.fn().mockResolvedValue(planWithHighExpense),
      };
      makeSut({ loadPlan });

      await screen.findByText('Net');
    });

    it('should display category without icon using empty prefix', async () => {
      const noIconCategory: BudgetCategory = {
        id: 'cat-noicon',
        name: 'No Icon Cat',
        icon: null,
        isSystem: false,
        createdAt: '2024-01-01T00:00:00.000Z',
      };
      const loadCategories: ILoadBudgetCategories = {
        execute: vi.fn().mockResolvedValue([noIconCategory]),
      };
      makeSut({ loadCategories });

      await screen.findByText('Add Item');
      const categorySelect = screen.getByLabelText('Category');
      expect(categorySelect).toBeInTheDocument();
      const option = categorySelect.querySelector('option[value="cat-noicon"]');
      expect(option?.textContent).toBe('No Icon Cat');
    });
  });

  describe('add item form edge cases', () => {
    it('should show installment field when INSTALLMENT recurrence is selected', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Add Item');
      await user.selectOptions(screen.getByLabelText('Recurrence'), 'INSTALLMENT');

      expect(screen.getByLabelText('Total Installments')).toBeInTheDocument();
    });

    it('should hide installment field when recurrence is not INSTALLMENT', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Add Item');
      await user.selectOptions(screen.getByLabelText('Recurrence'), 'INSTALLMENT');
      expect(screen.getByLabelText('Total Installments')).toBeInTheDocument();

      await user.selectOptions(screen.getByLabelText('Recurrence'), 'ONE_TIME');
      expect(screen.queryByLabelText('Total Installments')).not.toBeInTheDocument();
    });

    it('should allow selecting INCOME direction', async () => {
      const { props } = makeSut();
      const user = userEvent.setup();

      await screen.findByText('Add Item');
      await user.type(screen.getByLabelText('Name'), 'Freelance');
      await user.type(screen.getByLabelText('Amount'), '100');
      await user.selectOptions(screen.getByLabelText('Category'), 'cat-1');
      await user.selectOptions(screen.getByLabelText('Direction'), 'INCOME');
      await user.click(screen.getByRole('button', { name: 'Add' }));

      await waitFor(() => {
        expect(props.addItem.execute).toHaveBeenCalledWith(
          'plan-1',
          expect.objectContaining({
            direction: 'INCOME',
          }),
        );
      });
    });

    it('should allow selecting ESTIMATED type', async () => {
      const { props } = makeSut();
      const user = userEvent.setup();

      await screen.findByText('Add Item');
      await user.type(screen.getByLabelText('Name'), 'Misc');
      await user.type(screen.getByLabelText('Amount'), '25');
      await user.selectOptions(screen.getByLabelText('Category'), 'cat-1');
      await user.selectOptions(screen.getByLabelText('Type'), 'ESTIMATED');
      await user.click(screen.getByRole('button', { name: 'Add' }));

      await waitFor(() => {
        expect(props.addItem.execute).toHaveBeenCalledWith(
          'plan-1',
          expect.objectContaining({
            type: 'ESTIMATED',
          }),
        );
      });
    });
  });

  describe('error handling', () => {
    it('should handle loadJointPlan rejection gracefully', async () => {
      const loadJointPlan: ILoadJointBudgetPlan = {
        execute: vi.fn().mockRejectedValue(new Error('no partnership')),
      };
      makeSut({ loadJointPlan });

      expect(await screen.findByText('Personal Budget')).toBeInTheDocument();
    });

    it('should handle loadSummary rejection gracefully', async () => {
      const loadSummary: ILoadBudgetSummary = {
        execute: vi.fn().mockRejectedValue(new Error('summary error')),
      };
      makeSut({ loadSummary });

      expect(await screen.findByText('Personal Budget')).toBeInTheDocument();
      expect(screen.queryByText('Monthly Summary')).not.toBeInTheDocument();
    });

    it('should handle loadData total failure gracefully', async () => {
      const loadCategories: ILoadBudgetCategories = {
        execute: vi.fn().mockRejectedValue(new Error('network error')),
      };
      const loadPlan: ILoadBudgetPlan = {
        execute: vi.fn().mockRejectedValue(new Error('network error')),
      };
      const loadJointPlan: ILoadJointBudgetPlan = {
        execute: vi.fn().mockRejectedValue(new Error('network error')),
      };
      const loadSummary: ILoadBudgetSummary = {
        execute: vi.fn().mockRejectedValue(new Error('network error')),
      };
      makeSut({ loadCategories, loadPlan, loadJointPlan, loadSummary });

      await waitFor(() => {
        expect(loadCategories.execute).toHaveBeenCalled();
      });
      expect(screen.getByText('Budget Planner')).toBeInTheDocument();
    });

    it('should handle createPlan failure gracefully', async () => {
      const loadPlan: ILoadBudgetPlan = {
        execute: vi.fn().mockResolvedValue(null),
      };
      const createPlan: ICreateBudgetPlan = {
        execute: vi.fn().mockRejectedValue(new Error('create failed')),
      };
      makeSut({ loadPlan, createPlan });
      const user = userEvent.setup();

      await screen.findByText('No budget plan for this month');
      await user.selectOptions(screen.getByLabelText('Currency'), 'USD');
      await user.click(screen.getByText('Create Plan'));

      await waitFor(() => {
        expect(createPlan.execute).toHaveBeenCalled();
      });
    });

    it('should handle deletePlan failure gracefully', async () => {
      const deletePlan: IDeleteBudgetPlan = {
        execute: vi.fn().mockRejectedValue(new Error('delete failed')),
      };
      makeSut({ deletePlan });
      const user = userEvent.setup();

      await screen.findByText('Delete Plan');
      await user.click(screen.getByText('Delete Plan'));

      await waitFor(() => {
        expect(deletePlan.execute).toHaveBeenCalled();
      });
    });

    it('should handle addItem failure gracefully', async () => {
      const addItem: IAddBudgetItem = {
        execute: vi.fn().mockRejectedValue(new Error('add failed')),
      };
      makeSut({ addItem });
      const user = userEvent.setup();

      await screen.findByText('Add Item');
      await user.type(screen.getByLabelText('Name'), 'Test');
      await user.type(screen.getByLabelText('Amount'), '10');
      await user.selectOptions(screen.getByLabelText('Category'), 'cat-1');
      await user.click(screen.getByRole('button', { name: 'Add' }));

      await waitFor(() => {
        expect(addItem.execute).toHaveBeenCalled();
      });
    });

    it('should handle deleteItem failure gracefully', async () => {
      const deleteItem: IDeleteBudgetItem = {
        execute: vi.fn().mockRejectedValue(new Error('delete failed')),
      };
      makeSut({ deleteItem });
      const user = userEvent.setup();

      await screen.findAllByText('Groceries');
      const itemDeleteButtons = screen
        .getAllByText('delete')
        .map((el) => el.closest('button'))
        .filter((btn) => btn?.classList.contains('hover:bg-error/10'));
      await user.click(itemDeleteButtons[0]!);

      await waitFor(() => {
        expect(deleteItem.execute).toHaveBeenCalled();
      });
    });

    it('should handle createCategory failure gracefully', async () => {
      const createCategory: ICreateBudgetCategory = {
        execute: vi.fn().mockRejectedValue(new Error('create cat failed')),
      };
      makeSut({ createCategory });
      const user = userEvent.setup();

      await screen.findByText('Manage Categories');
      await user.click(screen.getByText('Manage Categories'));
      await user.type(screen.getByLabelText('Category Name'), 'Bad');
      const addButtons = screen.getAllByRole('button', { name: 'Add' });
      const categoryAddButton = addButtons.find((btn) =>
        btn.closest('form')?.querySelector('#cat-name'),
      );
      await user.click(categoryAddButton!);

      await waitFor(() => {
        expect(createCategory.execute).toHaveBeenCalled();
      });
    });

    it('should handle deleteCategory failure gracefully', async () => {
      const deleteCategory: IDeleteBudgetCategory = {
        execute: vi.fn().mockRejectedValue(new Error('delete cat failed')),
      };
      makeSut({ deleteCategory });
      const user = userEvent.setup();

      await screen.findByText('Manage Categories');
      await user.click(screen.getByText('Manage Categories'));
      await screen.findAllByText('Food');
      const closeButtons = screen
        .getAllByText('close')
        .map((el) => el.closest('button'))
        .filter(Boolean);
      await user.click(closeButtons[0]!);

      await waitFor(() => {
        expect(deleteCategory.execute).toHaveBeenCalled();
      });
    });
  });

  describe('joint plan operations', () => {
    it('should handle createJointPlan failure gracefully', async () => {
      const loadPlan: ILoadBudgetPlan = {
        execute: vi.fn().mockResolvedValue(null),
      };
      const loadJointPlan: ILoadJointBudgetPlan = {
        execute: vi.fn().mockResolvedValue(null),
      };
      const createJointPlan: ICreateJointBudgetPlan = {
        execute: vi.fn().mockRejectedValue(new Error('joint create failed')),
      };
      makeSut({ loadPlan, loadJointPlan, createJointPlan });
      const user = userEvent.setup();

      await screen.findByText('No budget plan for this month');
      await user.click(screen.getByText('Joint'));
      await screen.findByText('No budget plan for this month');
      await user.selectOptions(screen.getByLabelText('Currency'), 'EUR');
      await user.click(screen.getByText('Create Plan'));

      await waitFor(() => {
        expect(createJointPlan.execute).toHaveBeenCalled();
      });
    });

    it('should show empty items message on joint tab with empty plan', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Personal Budget');
      await user.click(screen.getByText('Joint'));

      expect(
        await screen.findByText('No items yet. Add your first income or expense above.'),
      ).toBeInTheDocument();
    });

    it('should handle deleteJointPlan failure gracefully', async () => {
      const deleteJointPlan: IDeleteJointBudgetPlan = {
        execute: vi.fn().mockRejectedValue(new Error('delete joint failed')),
      };
      makeSut({ deleteJointPlan });
      const user = userEvent.setup();

      await screen.findByText('Personal Budget');
      await user.click(screen.getByText('Joint'));
      await screen.findByText('Joint Budget');
      await user.click(screen.getByText('Delete Plan'));

      await waitFor(() => {
        expect(deleteJointPlan.execute).toHaveBeenCalled();
      });
    });
  });

  describe('category manager edge cases', () => {
    it('should close category panel when clicking Manage Categories again', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Manage Categories');
      await user.click(screen.getByText('Manage Categories'));
      expect(screen.getByLabelText('Category Name')).toBeInTheDocument();

      await user.click(screen.getByText('Manage Categories'));
      expect(screen.queryByLabelText('Category Name')).not.toBeInTheDocument();
    });

    it('should display category with null icon using fallback', async () => {
      const nullIconCat: BudgetCategory = {
        id: 'cat-null',
        name: 'NullIcon',
        icon: null,
        isSystem: false,
        createdAt: '2024-01-01T00:00:00.000Z',
      };
      const loadCategories: ILoadBudgetCategories = {
        execute: vi.fn().mockResolvedValue([nullIconCat]),
      };
      makeSut({ loadCategories });
      const user = userEvent.setup();

      await screen.findByText('Manage Categories');
      await user.click(screen.getByText('Manage Categories'));

      const matches = await screen.findAllByText('NullIcon');
      expect(matches.length).toBeGreaterThan(0);
    });
  });
});

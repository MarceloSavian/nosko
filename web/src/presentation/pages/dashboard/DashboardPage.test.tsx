import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { DashboardData } from '@/domain/models/dashboard/Dashboard';
import type { ILoadDashboard } from '@/domain/usecases/dashboard/ILoadDashboard';
import { renderWithI18n } from '@/test/i18n';
import { DashboardPage } from './DashboardPage';

const dashboardData: DashboardData = {
  yearMonth: '2026-04',
  totalSpending: -150075,
  budgetSummary: [
    { categoryName: 'Food', planned: 50000, actual: 35000 },
    { categoryName: 'Rent', planned: 200000, actual: 200000 },
  ],
  recentTransactions: [
    { id: 'tx-1', description: 'Grocery Store', amount: -5000, transactionDate: '2026-04-01' },
    { id: 'tx-2', description: 'Salary', amount: 300000, transactionDate: '2026-04-02' },
  ],
};

const emptyDashboardData: DashboardData = {
  yearMonth: '2026-04',
  totalSpending: 0,
  budgetSummary: [],
  recentTransactions: [],
};

describe('DashboardPage', () => {
  const makeSut = (data: DashboardData = dashboardData) => {
    const loadDashboardSpy: ILoadDashboard = {
      execute: vi.fn().mockResolvedValue(data),
    };
    renderWithI18n(<DashboardPage loadDashboard={loadDashboardSpy} />);
    return { loadDashboardSpy };
  };

  describe('loading state', () => {
    it('should show loading spinner initially', () => {
      const loadDashboardSpy: ILoadDashboard = {
        execute: vi.fn().mockReturnValue(new Promise(() => {})),
      };
      renderWithI18n(<DashboardPage loadDashboard={loadDashboardSpy} />);

      expect(screen.getByText('progress_activity')).toBeInTheDocument();
    });
  });

  describe('successful load', () => {
    it('should display total spending', async () => {
      makeSut();

      await waitFor(() => {
        expect(screen.getByText('Total Spending')).toBeInTheDocument();
      });
      expect(screen.getByText(/1,500\.75/)).toBeInTheDocument();
    });

    it('should display recent transactions section', async () => {
      makeSut();

      await waitFor(() => {
        expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
      });
      expect(screen.getByText('Grocery Store')).toBeInTheDocument();
      expect(screen.getByText('Salary')).toBeInTheDocument();
    });

    it('should display transaction dates', async () => {
      makeSut();

      await waitFor(() => {
        expect(screen.getByText('2026-04-01')).toBeInTheDocument();
      });
      expect(screen.getByText('2026-04-02')).toBeInTheDocument();
    });

    it('should display budget summary section', async () => {
      makeSut();

      await waitFor(() => {
        expect(screen.getByText('Budget Summary')).toBeInTheDocument();
      });
      expect(screen.getAllByText('Food').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Rent').length).toBeGreaterThanOrEqual(1);
    });

    it('should display budget amounts with planned values', async () => {
      makeSut();

      await waitFor(() => {
        expect(screen.getByText('Budget Summary')).toBeInTheDocument();
      });
      expect(screen.getByText('$350.00')).toBeInTheDocument();
      expect(screen.getByText(/of \$500\.00/)).toBeInTheDocument();
    });

    it('should display monthly insights section', async () => {
      makeSut();

      await waitFor(() => {
        expect(screen.getByText('Monthly Insights')).toBeInTheDocument();
      });
    });

    it('should display financial dashboard heading', async () => {
      makeSut();

      await waitFor(() => {
        expect(screen.getByText('Financial Dashboard')).toBeInTheDocument();
      });
    });

    it('should call loadDashboard.execute with current yearMonth', async () => {
      const { loadDashboardSpy } = makeSut();

      await waitFor(() => {
        expect(loadDashboardSpy.execute).toHaveBeenCalledOnce();
      });
      const calledWith = vi.mocked(loadDashboardSpy.execute).mock.calls[0]?.[0];
      expect(calledWith).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  describe('month navigation', () => {
    it('should navigate to previous month when clicking prev button', async () => {
      const { loadDashboardSpy } = makeSut();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Financial Dashboard')).toBeInTheDocument();
      });

      const prevButton = screen.getByText('chevron_left').closest('button')!;
      await user.click(prevButton);

      await waitFor(() => {
        expect(loadDashboardSpy.execute).toHaveBeenCalledTimes(2);
      });
    });

    it('should navigate to next month when clicking next button', async () => {
      const { loadDashboardSpy } = makeSut();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Financial Dashboard')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('chevron_right').closest('button')!;
      await user.click(nextButton);

      await waitFor(() => {
        expect(loadDashboardSpy.execute).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('error state', () => {
    it('should display error message when loading fails', async () => {
      const loadDashboardSpy: ILoadDashboard = {
        execute: vi.fn().mockRejectedValue(new Error('Network error')),
      };
      renderWithI18n(<DashboardPage loadDashboard={loadDashboardSpy} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load dashboard.')).toBeInTheDocument();
      });
    });
  });

  describe('empty states', () => {
    it('should show empty transactions message when no transactions exist', async () => {
      makeSut(emptyDashboardData);

      await waitFor(() => {
        expect(screen.getByText('No recent transactions.')).toBeInTheDocument();
      });
    });

    it('should show empty budget message when no budget data exists', async () => {
      makeSut(emptyDashboardData);

      await waitFor(() => {
        expect(screen.getByText('No budget data for this month.')).toBeInTheDocument();
      });
    });
  });

  describe('transaction branches', () => {
    it('should show fallback text when transaction description is null', async () => {
      const dataWithNullDesc: DashboardData = {
        ...dashboardData,
        recentTransactions: [
          {
            id: 'tx-no-desc',
            description: null as unknown as string,
            amount: -1000,
            transactionDate: '2026-04-05',
          },
        ],
      };
      makeSut(dataWithNullDesc);

      await waitFor(() => {
        expect(screen.getByText('Transaction')).toBeInTheDocument();
      });
    });

    it('should use tertiary color for positive transaction amounts', async () => {
      makeSut();

      await waitFor(() => {
        expect(screen.getByText('Salary')).toBeInTheDocument();
      });
      const salaryAmount = screen.getByText('$3,000.00');
      expect(salaryAmount.className).toContain('text-tertiary');
    });

    it('should use primary color for negative transaction amounts', async () => {
      makeSut();

      await waitFor(() => {
        expect(screen.getByText('Grocery Store')).toBeInTheDocument();
      });
      const groceryAmount = screen.getByText('-$50.00');
      expect(groceryAmount.className).toContain('text-primary');
    });
  });

  describe('budget branches', () => {
    it('should handle budget item with zero planned amount', async () => {
      const dataWithZeroPlanned: DashboardData = {
        ...dashboardData,
        budgetSummary: [{ categoryName: 'Misc', planned: 0, actual: 500 }],
      };
      makeSut(dataWithZeroPlanned);

      await waitFor(() => {
        expect(screen.getByText('Budget Summary')).toBeInTheDocument();
      });
      expect(screen.getAllByText('Misc').length).toBeGreaterThanOrEqual(1);
    });

    it('should display "Over budget" in insights when actual exceeds planned', async () => {
      const dataOverBudget: DashboardData = {
        ...dashboardData,
        budgetSummary: [{ categoryName: 'Food', planned: 10000, actual: 20000 }],
      };
      makeSut(dataOverBudget);

      await waitFor(() => {
        expect(screen.getByText('Over budget')).toBeInTheDocument();
      });
    });

    it('should display "On track" in insights when actual is within planned', async () => {
      makeSut();

      await waitFor(() => {
        expect(screen.getAllByText('On track').length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('formatCents display', () => {
    it('should format negative amounts with minus sign and dollar', async () => {
      makeSut();

      await waitFor(() => {
        expect(screen.getByText(/-\$50\.00/)).toBeInTheDocument();
      });
    });

    it('should format positive amounts with dollar sign', async () => {
      makeSut();

      await waitFor(() => {
        expect(screen.getByText(/\$3,000\.00/)).toBeInTheDocument();
      });
    });

    it('should display zero as $0.00 for empty dashboard', async () => {
      makeSut(emptyDashboardData);

      await waitFor(() => {
        expect(screen.getByText('$0.00')).toBeInTheDocument();
      });
    });
  });
});

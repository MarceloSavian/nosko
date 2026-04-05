import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { BankAccount } from '@/domain/models/partnership/Partnership';
import type { ILoadAccounts } from '@/domain/usecases/partnership/ILoadAccounts';
import type { ILoadSharedAccounts } from '@/domain/usecases/partnership/ILoadSharedAccounts';
import type { ISetSharedAccounts } from '@/domain/usecases/partnership/ISetSharedAccounts';
import { renderWithI18n } from '@/test/i18n';
import { SelectSharedAccountsPage } from './SelectSharedAccountsPage';

const checkingAccount: BankAccount = {
  id: 'acc-1',
  institutionId: 'inst-1',
  accountName: 'Main Checking',
  currencyCode: 'USD',
  balance: 10000,
  accountType: 'CHECKING',
  balanceUpdatedAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
};

const savingsAccount: BankAccount = {
  id: 'acc-2',
  institutionId: 'inst-1',
  accountName: 'Savings',
  currencyCode: 'EUR',
  balance: 5000,
  accountType: 'SAVINGS',
  balanceUpdatedAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
};

const creditAccount: BankAccount = {
  id: 'acc-3',
  institutionId: 'inst-1',
  accountName: 'Credit Card',
  currencyCode: 'USD',
  balance: 2000,
  accountType: 'CREDIT',
  balanceUpdatedAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
};

const investmentAccount: BankAccount = {
  id: 'acc-4',
  institutionId: 'inst-1',
  accountName: 'Investment Portfolio',
  currencyCode: 'USD',
  balance: 50000,
  accountType: 'INVESTMENT',
  balanceUpdatedAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
};

const unknownTypeAccount = {
  id: 'acc-5',
  institutionId: 'inst-1',
  accountName: 'Unknown Account',
  currencyCode: 'BRL',
  balance: 1000,
  accountType: 'OTHER',
  balanceUpdatedAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
} as BankAccount;

type UseCases = {
  loadAccounts: ILoadAccounts;
  loadSharedAccounts: ILoadSharedAccounts;
  setSharedAccounts: ISetSharedAccounts;
};

function renderWithRouter(useCases: UseCases) {
  const rootRoute = createRootRoute();
  const selectAccountsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/partner-setup/select-accounts',
    component: () => (
      <SelectSharedAccountsPage
        loadAccountsUseCase={useCases.loadAccounts}
        loadSharedAccountsUseCase={useCases.loadSharedAccounts}
        setSharedAccountsUseCase={useCases.setSharedAccounts}
      />
    ),
  });
  const inviteRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/partner-setup/invite',
    component: () => <div>Invite Page</div>,
  });
  const contributionRulesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/partner-setup/contribution-rules',
    component: () => <div>Contribution Rules Page</div>,
  });
  const routeTree = rootRoute.addChildren([
    selectAccountsRoute,
    inviteRoute,
    contributionRulesRoute,
  ]);
  const memoryHistory = createMemoryHistory({ initialEntries: ['/partner-setup/select-accounts'] });
  const router = createRouter({ routeTree, history: memoryHistory });
  renderWithI18n(
    // biome-ignore lint/suspicious/noExplicitAny: test router type mismatch with register
    <RouterProvider router={router as any} />,
  );
  return { router };
}

function makeUseCases(overrides?: Partial<UseCases>): UseCases {
  return {
    loadAccounts: { execute: vi.fn().mockResolvedValue([checkingAccount, savingsAccount]) },
    loadSharedAccounts: { execute: vi.fn().mockResolvedValue([]) },
    setSharedAccounts: { execute: vi.fn().mockResolvedValue([]) },
    ...overrides,
  };
}

describe('SelectSharedAccountsPage', () => {
  describe('render', () => {
    const makeSut = () => {
      const useCases = makeUseCases();
      renderWithRouter(useCases);
      return { useCases };
    };

    it('should display the page heading', async () => {
      makeSut();

      expect(await screen.findByText('Which stories shall we share?')).toBeInTheDocument();
    });

    it('should display accounts after loading', async () => {
      makeSut();

      expect(await screen.findByText('Main Checking')).toBeInTheDocument();
      expect(screen.getByText('Savings')).toBeInTheDocument();
    });

    it('should display account type and currency', async () => {
      makeSut();

      expect(await screen.findByText(/CHECKING/)).toBeInTheDocument();
      expect(screen.getByText(/USD/)).toBeInTheDocument();
      expect(screen.getByText(/SAVINGS/)).toBeInTheDocument();
      expect(screen.getByText(/EUR/)).toBeInTheDocument();
    });

    it('should display empty state when no accounts exist', async () => {
      const useCases = makeUseCases({
        loadAccounts: { execute: vi.fn().mockResolvedValue([]) },
      });
      renderWithRouter(useCases);

      expect(await screen.findByText(/No bank accounts found/)).toBeInTheDocument();
    });

    it('should render account with unknown type using fallback icon', async () => {
      const useCases = makeUseCases({
        loadAccounts: {
          execute: vi.fn().mockResolvedValue([unknownTypeAccount]),
        },
        loadSharedAccounts: { execute: vi.fn().mockResolvedValue([]) },
      });
      renderWithRouter(useCases);

      expect(await screen.findByText('Unknown Account')).toBeInTheDocument();
      expect(screen.getByText(/OTHER/)).toBeInTheDocument();
    });

    it('should render all known account type icons', async () => {
      const useCases = makeUseCases({
        loadAccounts: {
          execute: vi
            .fn()
            .mockResolvedValue([checkingAccount, savingsAccount, creditAccount, investmentAccount]),
        },
        loadSharedAccounts: { execute: vi.fn().mockResolvedValue([]) },
      });
      renderWithRouter(useCases);

      expect(await screen.findByText('Main Checking')).toBeInTheDocument();
      expect(screen.getByText('Savings')).toBeInTheDocument();
      expect(screen.getByText('Credit Card')).toBeInTheDocument();
      expect(screen.getByText('Investment Portfolio')).toBeInTheDocument();
    });
  });

  describe('shared account selection', () => {
    it('should mark accounts as shared when returned by loadSharedAccounts', async () => {
      const useCases = makeUseCases({
        loadSharedAccounts: { execute: vi.fn().mockResolvedValue([checkingAccount]) },
      });
      renderWithRouter(useCases);

      await screen.findByText('Main Checking');

      const switches = screen.getAllByRole('switch');
      const checkingSwitch = switches[0];
      const savingsSwitch = switches[1];

      expect(checkingSwitch).toHaveAttribute('aria-checked', 'true');
      expect(savingsSwitch).toHaveAttribute('aria-checked', 'false');
    });

    it('should toggle account selection when switch is clicked', async () => {
      const useCases = makeUseCases();
      renderWithRouter(useCases);
      const user = userEvent.setup();

      await screen.findByText('Main Checking');

      const switches = screen.getAllByRole('switch');
      expect(switches[0]).toHaveAttribute('aria-checked', 'false');

      await user.click(switches[0]);

      expect(switches[0]).toHaveAttribute('aria-checked', 'true');
    });

    it('should deselect a shared account when switch is clicked', async () => {
      const useCases = makeUseCases({
        loadSharedAccounts: { execute: vi.fn().mockResolvedValue([checkingAccount]) },
      });
      renderWithRouter(useCases);
      const user = userEvent.setup();

      await screen.findByText('Main Checking');

      const switches = screen.getAllByRole('switch');
      expect(switches[0]).toHaveAttribute('aria-checked', 'true');

      await user.click(switches[0]);

      expect(switches[0]).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('save', () => {
    it('should call setSharedAccounts with selected account ids when save is clicked', async () => {
      const useCases = makeUseCases({
        loadSharedAccounts: { execute: vi.fn().mockResolvedValue([checkingAccount]) },
      });
      vi.spyOn(useCases.setSharedAccounts, 'execute').mockResolvedValueOnce([checkingAccount]);
      renderWithRouter(useCases);
      const user = userEvent.setup();

      await screen.findByText('Main Checking');
      await user.click(screen.getByRole('button', { name: /Save/ }));

      await waitFor(() => {
        expect(useCases.setSharedAccounts.execute).toHaveBeenCalledWith({
          bankAccountIds: ['acc-1'],
        });
      });
    });

    it('should send empty array when no accounts are selected', async () => {
      const useCases = makeUseCases();
      vi.spyOn(useCases.setSharedAccounts, 'execute').mockResolvedValueOnce([]);
      renderWithRouter(useCases);
      const user = userEvent.setup();

      await screen.findByText('Main Checking');
      await user.click(screen.getByRole('button', { name: /Save/ }));

      await waitFor(() => {
        expect(useCases.setSharedAccounts.execute).toHaveBeenCalledWith({
          bankAccountIds: [],
        });
      });
    });
  });

  describe('error handling', () => {
    it('should display error when loading accounts fails', async () => {
      const useCases = makeUseCases({
        loadAccounts: { execute: vi.fn().mockRejectedValue(new Error('fail')) },
      });
      renderWithRouter(useCases);

      expect(await screen.findByText('Failed to load accounts')).toBeInTheDocument();
    });

    it('should display error when saving shared accounts fails', async () => {
      const useCases = makeUseCases();
      vi.spyOn(useCases.setSharedAccounts, 'execute').mockRejectedValueOnce(new Error('fail'));
      renderWithRouter(useCases);
      const user = userEvent.setup();

      await screen.findByText('Main Checking');
      await user.click(screen.getByRole('button', { name: /Save/ }));

      await waitFor(() => {
        expect(screen.getByText('Failed to save shared accounts')).toBeInTheDocument();
      });
    });
  });

  describe('navigation', () => {
    it('should display back link', async () => {
      const useCases = makeUseCases();
      renderWithRouter(useCases);

      expect(await screen.findByText('Back')).toBeInTheDocument();
    });

    it('should display next link', async () => {
      const useCases = makeUseCases();
      renderWithRouter(useCases);

      expect(await screen.findByText('Next')).toBeInTheDocument();
    });
  });
});

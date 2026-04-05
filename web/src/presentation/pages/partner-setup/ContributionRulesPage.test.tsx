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
import type { ContributionRule } from '@/domain/models/partnership/Partnership';
import type { ILoadContributionRules } from '@/domain/usecases/partnership/ILoadContributionRules';
import type { ISetContributionRules } from '@/domain/usecases/partnership/ISetContributionRules';
import { renderWithI18n } from '@/test/i18n';
import { ContributionRulesPage } from './ContributionRulesPage';

const equalRule: ContributionRule = {
  id: 'rule-1',
  partnershipId: 'p-1',
  type: 'EQUAL',
  customerAPercentage: 50,
  customerBPercentage: 50,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const customRule: ContributionRule = {
  id: 'rule-2',
  partnershipId: 'p-1',
  type: 'CUSTOM_PERCENTAGE',
  customerAPercentage: 60,
  customerBPercentage: 40,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const salaryRule: ContributionRule = {
  id: 'rule-3',
  partnershipId: 'p-1',
  type: 'SALARY_PROPORTIONAL',
  customerAPercentage: 70,
  customerBPercentage: 30,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const salaryRuleNullPercentages: ContributionRule = {
  id: 'rule-4',
  partnershipId: 'p-1',
  type: 'SALARY_PROPORTIONAL',
  customerAPercentage: null,
  customerBPercentage: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

type UseCases = {
  loadContributionRules: ILoadContributionRules;
  setContributionRules: ISetContributionRules;
};

function renderWithRouter(useCases: UseCases) {
  const rootRoute = createRootRoute();
  const contributionRulesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/partner-setup/contribution-rules',
    component: () => (
      <ContributionRulesPage
        loadContributionRulesUseCase={useCases.loadContributionRules}
        setContributionRulesUseCase={useCases.setContributionRules}
      />
    ),
  });
  const selectAccountsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/partner-setup/select-accounts',
    component: () => <div>Select Accounts Page</div>,
  });
  const routeTree = rootRoute.addChildren([contributionRulesRoute, selectAccountsRoute]);
  const memoryHistory = createMemoryHistory({
    initialEntries: ['/partner-setup/contribution-rules'],
  });
  const router = createRouter({ routeTree, history: memoryHistory });
  renderWithI18n(
    // biome-ignore lint/suspicious/noExplicitAny: test router type mismatch with register
    <RouterProvider router={router as any} />,
  );
  return { router };
}

function makeUseCases(overrides?: Partial<UseCases>): UseCases {
  return {
    loadContributionRules: { execute: vi.fn().mockResolvedValue(equalRule) },
    setContributionRules: { execute: vi.fn().mockResolvedValue(equalRule) },
    ...overrides,
  };
}

describe('ContributionRulesPage', () => {
  describe('render', () => {
    const makeSut = () => {
      const useCases = makeUseCases();
      renderWithRouter(useCases);
      return { useCases };
    };

    it('should display the page heading', async () => {
      makeSut();

      expect(await screen.findByText('Contribution Rules')).toBeInTheDocument();
    });

    it('should display step indicator', async () => {
      makeSut();

      expect(await screen.findByText('Step 3 of 3')).toBeInTheDocument();
    });

    it('should display the three rule options', async () => {
      makeSut();

      expect(await screen.findByText('50/50 Split')).toBeInTheDocument();
      expect(screen.getByText('Salary-Based')).toBeInTheDocument();
      expect(screen.getByText('Custom %')).toBeInTheDocument();
    });

    it('should display the preview section', async () => {
      makeSut();

      expect(await screen.findByText('Preview')).toBeInTheDocument();
      expect(screen.getByText('Partner A')).toBeInTheDocument();
      expect(screen.getByText('Partner B')).toBeInTheDocument();
    });

    it('should display the finish setup button', async () => {
      makeSut();

      expect(await screen.findByRole('button', { name: /Finish Setup/i })).toBeInTheDocument();
    });
  });

  describe('rule selection', () => {
    it('should show 50/50 preview for EQUAL rule', async () => {
      const useCases = makeUseCases();
      renderWithRouter(useCases);

      await screen.findByText('50/50 Split');

      const percentages = screen.getAllByText('50%');
      expect(percentages).toHaveLength(2);
    });

    it('should show custom percentage inputs when Custom % is selected', async () => {
      const useCases = makeUseCases();
      renderWithRouter(useCases);
      const user = userEvent.setup();

      const customButton = await screen.findByText('Custom %');
      await user.click(customButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Partner A %')).toBeInTheDocument();
        expect(screen.getByLabelText('Partner B %')).toBeInTheDocument();
      });
    });

    it('should fallback to 50% preview when CUSTOM_PERCENTAGE has no customerAPercentage set', async () => {
      const equalRuleNullPercentages: ContributionRule = {
        id: 'rule-null',
        partnershipId: 'p-1',
        type: 'EQUAL',
        customerAPercentage: null,
        customerBPercentage: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      const useCases = makeUseCases({
        loadContributionRules: { execute: vi.fn().mockResolvedValue(equalRuleNullPercentages) },
      });
      renderWithRouter(useCases);
      const user = userEvent.setup();

      const customButton = await screen.findByText('Custom %');
      await user.click(customButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Partner A %')).toBeInTheDocument();
      });

      const percentages = screen.getAllByText('50%');
      expect(percentages).toHaveLength(2);
    });

    it('should not show custom percentage inputs when EQUAL is selected', async () => {
      const useCases = makeUseCases();
      renderWithRouter(useCases);

      await screen.findByText('50/50 Split');

      expect(screen.queryByLabelText('Partner A %')).not.toBeInTheDocument();
    });
  });

  describe('submission', () => {
    it('should call setContributionRules when form is submitted with EQUAL', async () => {
      const useCases = makeUseCases();
      vi.spyOn(useCases.setContributionRules, 'execute').mockResolvedValueOnce(equalRule);
      renderWithRouter(useCases);
      const user = userEvent.setup();

      const submitButton = await screen.findByRole('button', { name: /Finish Setup/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(useCases.setContributionRules.execute).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'EQUAL' }),
        );
      });
    });

    it('should call setContributionRules with custom percentages', async () => {
      const useCases = makeUseCases();
      vi.spyOn(useCases.setContributionRules, 'execute').mockResolvedValueOnce(customRule);
      renderWithRouter(useCases);
      const user = userEvent.setup();

      const customButton = await screen.findByText('Custom %');
      await user.click(customButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Partner A %')).toBeInTheDocument();
      });

      const partnerAInput = screen.getByLabelText('Partner A %');
      const partnerBInput = screen.getByLabelText('Partner B %');

      await user.clear(partnerAInput);
      await user.type(partnerAInput, '60');
      await user.clear(partnerBInput);
      await user.type(partnerBInput, '40');

      await user.click(screen.getByRole('button', { name: /Finish Setup/i }));

      await waitFor(() => {
        expect(useCases.setContributionRules.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'CUSTOM_PERCENTAGE',
            customerAPercentage: 60,
            customerBPercentage: 40,
          }),
        );
      });
    });

    it('should load existing rule into the form', async () => {
      const useCases = makeUseCases({
        loadContributionRules: { execute: vi.fn().mockResolvedValue(customRule) },
      });
      renderWithRouter(useCases);

      await waitFor(() => {
        expect(screen.getByLabelText('Partner A %')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Partner A %')).toHaveValue(60);
      expect(screen.getByLabelText('Partner B %')).toHaveValue(40);
    });

    it('should not set percentage fields when loaded rule has null percentages', async () => {
      const useCases = makeUseCases({
        loadContributionRules: { execute: vi.fn().mockResolvedValue(salaryRuleNullPercentages) },
      });
      renderWithRouter(useCases);

      await screen.findByText('Contribution Rules');

      expect(screen.queryByLabelText('Partner A %')).not.toBeInTheDocument();
    });

    it('should use currentRule customerAPercentage for SALARY_PROPORTIONAL preview', async () => {
      const useCases = makeUseCases({
        loadContributionRules: { execute: vi.fn().mockResolvedValue(salaryRule) },
      });
      renderWithRouter(useCases);

      await screen.findByText('Contribution Rules');

      expect(screen.getByText('70%')).toBeInTheDocument();
      expect(screen.getByText('30%')).toBeInTheDocument();
    });

    it('should fallback to 50% preview when SALARY_PROPORTIONAL rule has null customerAPercentage', async () => {
      const useCases = makeUseCases({
        loadContributionRules: { execute: vi.fn().mockResolvedValue(salaryRuleNullPercentages) },
      });
      renderWithRouter(useCases);

      await screen.findByText('Contribution Rules');

      const percentages = screen.getAllByText('50%');
      expect(percentages).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('should display error when loading contribution rules fails', async () => {
      const useCases = makeUseCases({
        loadContributionRules: { execute: vi.fn().mockRejectedValue(new Error('fail')) },
      });
      renderWithRouter(useCases);

      expect(await screen.findByText('Failed to load contribution rules')).toBeInTheDocument();
    });

    it('should display error when saving contribution rules fails', async () => {
      const useCases = makeUseCases();
      vi.spyOn(useCases.setContributionRules, 'execute').mockRejectedValueOnce(new Error('fail'));
      renderWithRouter(useCases);
      const user = userEvent.setup();

      const submitButton = await screen.findByRole('button', { name: /Finish Setup/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to save contribution rules')).toBeInTheDocument();
      });
    });
  });

  describe('navigation', () => {
    it('should display back link', async () => {
      const useCases = makeUseCases();
      renderWithRouter(useCases);

      expect(await screen.findByText('Back')).toBeInTheDocument();
    });
  });
});

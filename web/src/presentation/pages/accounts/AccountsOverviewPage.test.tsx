import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { BankAccount } from '@/domain/models/account/Account';
import type { Institution } from '@/domain/models/institution/Institution';
import type { ICreateAccount } from '@/domain/usecases/account/ICreateAccount';
import type { IDeleteAccount } from '@/domain/usecases/account/IDeleteAccount';
import type { ILoadAccountOverview } from '@/domain/usecases/account/ILoadAccountOverview';
import type { ILoadAccounts } from '@/domain/usecases/account/ILoadAccounts';
import type { IUpdateAccount } from '@/domain/usecases/account/IUpdateAccount';
import type { ILoadInstitutions } from '@/domain/usecases/institution/ILoadInstitutions';
import { renderWithI18n } from '@/test/i18n';
import { AccountsOverviewPage } from './AccountsOverviewPage';

const institutions: Institution[] = [
  { id: 'inst-1', name: 'Bank of America', countryCode: 'US', logoUrl: null },
  { id: 'inst-2', name: 'Nubank', countryCode: 'BR', logoUrl: null },
];

const accounts: BankAccount[] = [
  {
    id: 'acc-1',
    institutionId: 'inst-1',
    accountName: 'Main Checking',
    currencyCode: 'USD',
    balance: 10000,
    accountType: 'CHECKING',
    balanceUpdatedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'acc-2',
    institutionId: 'inst-2',
    accountName: 'Brazil Savings',
    currencyCode: 'BRL',
    balance: 50000,
    accountType: 'SAVINGS',
    balanceUpdatedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const overview = {
  totalsByCurrency: [
    { currencyCode: 'USD', total: 10000 },
    { currencyCode: 'BRL', total: 50000 },
  ],
};

const emptyOverview = { totalsByCurrency: [] };

describe('AccountsOverviewPage', () => {
  const makeSut = (
    overrides: {
      accounts?: BankAccount[];
      overviewData?: typeof overview;
      institutionsData?: Institution[];
    } = {},
  ) => {
    const loadAccountsSpy: ILoadAccounts = { execute: vi.fn() };
    const createAccountSpy: ICreateAccount = { execute: vi.fn() };
    const updateAccountSpy: IUpdateAccount = { execute: vi.fn() };
    const deleteAccountSpy: IDeleteAccount = { execute: vi.fn() };
    const loadAccountOverviewSpy: ILoadAccountOverview = { execute: vi.fn() };
    const loadInstitutionsSpy: ILoadInstitutions = { execute: vi.fn() };

    vi.spyOn(loadAccountsSpy, 'execute').mockResolvedValue(overrides.accounts ?? accounts);
    vi.spyOn(loadAccountOverviewSpy, 'execute').mockResolvedValue(
      overrides.overviewData ?? overview,
    );
    vi.spyOn(loadInstitutionsSpy, 'execute').mockResolvedValue(
      overrides.institutionsData ?? institutions,
    );

    renderWithI18n(
      <AccountsOverviewPage
        loadAccounts={loadAccountsSpy}
        createAccount={createAccountSpy}
        updateAccount={updateAccountSpy}
        deleteAccount={deleteAccountSpy}
        loadAccountOverview={loadAccountOverviewSpy}
        loadInstitutions={loadInstitutionsSpy}
      />,
    );

    return {
      loadAccountsSpy,
      createAccountSpy,
      updateAccountSpy,
      deleteAccountSpy,
      loadAccountOverviewSpy,
      loadInstitutionsSpy,
    };
  };

  describe('loading and displaying accounts', () => {
    it('should call all load use cases on mount', async () => {
      const { loadAccountsSpy, loadAccountOverviewSpy, loadInstitutionsSpy } = makeSut();

      await waitFor(() => {
        expect(loadAccountsSpy.execute).toHaveBeenCalledOnce();
        expect(loadAccountOverviewSpy.execute).toHaveBeenCalledOnce();
        expect(loadInstitutionsSpy.execute).toHaveBeenCalledOnce();
      });
    });

    it('should display account names after loading', async () => {
      makeSut();

      expect(await screen.findByText('Main Checking')).toBeInTheDocument();
      expect(screen.getByText('Brazil Savings')).toBeInTheDocument();
    });

    it('should display institution names for accounts', async () => {
      makeSut();

      expect(await screen.findByText('Bank of America')).toBeInTheDocument();
      expect(screen.getByText('Nubank')).toBeInTheDocument();
    });

    it('should display overview totals', async () => {
      makeSut();

      await waitFor(() => {
        expect(screen.getAllByText(/Total Balance/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe('empty state', () => {
    it('should display empty message when no accounts exist', async () => {
      makeSut({ accounts: [], overviewData: emptyOverview });

      expect(
        await screen.findByText('No accounts found. Add your first bank account to get started.'),
      ).toBeInTheDocument();
    });

    it('should display empty overview message when no totals exist', async () => {
      makeSut({ accounts: [], overviewData: emptyOverview });

      expect(
        await screen.findByText('No accounts yet. Add your first account to get started.'),
      ).toBeInTheDocument();
    });
  });

  describe('create account modal', () => {
    it('should open create modal when Add Account button is clicked', async () => {
      makeSut();
      const user = userEvent.setup();

      const addButtons = await screen.findAllByText('Add Account');
      await user.click(addButtons[0].closest('button')!);

      expect(screen.getByLabelText('Institution')).toBeInTheDocument();
      expect(screen.getByLabelText('Account Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Currency Code')).toBeInTheDocument();
    });

    it('should close create modal when Cancel is clicked', async () => {
      makeSut();
      const user = userEvent.setup();

      const addButtons = await screen.findAllByText('Add Account');
      await user.click(addButtons[0].closest('button')!);

      await user.click(screen.getByText('Cancel'));

      expect(screen.queryByLabelText('Institution')).not.toBeInTheDocument();
    });

    it('should show Creating... text while submitting', async () => {
      const { createAccountSpy } = makeSut();
      const user = userEvent.setup();

      let resolveCreate: (value: BankAccount) => void;
      vi.spyOn(createAccountSpy, 'execute').mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCreate = resolve;
          }),
      );

      const addButtons = await screen.findAllByText('Add Account');
      await user.click(addButtons[0].closest('button')!);

      await user.selectOptions(screen.getByLabelText('Institution'), 'inst-1');
      await user.type(screen.getByLabelText('Account Name'), 'Test Account');
      await user.type(screen.getByLabelText('Currency Code'), 'USD');
      await user.click(screen.getByText('Create Account'));

      expect(await screen.findByText('Creating...')).toBeInTheDocument();

      resolveCreate!(accounts[0]);
    });

    it('should call createAccount and refresh on successful creation', async () => {
      const { createAccountSpy, loadAccountsSpy } = makeSut();
      const user = userEvent.setup();

      vi.spyOn(createAccountSpy, 'execute').mockResolvedValueOnce(accounts[0]);

      const addButtons = await screen.findAllByText('Add Account');
      await user.click(addButtons[0].closest('button')!);

      await user.selectOptions(screen.getByLabelText('Institution'), 'inst-1');
      await user.type(screen.getByLabelText('Account Name'), 'New Account');
      await user.type(screen.getByLabelText('Currency Code'), 'USD');
      await user.click(screen.getByText('Create Account'));

      await waitFor(() => {
        expect(createAccountSpy.execute).toHaveBeenCalledOnce();
      });

      await waitFor(() => {
        expect(loadAccountsSpy.execute).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('edit account modal', () => {
    it('should open edit modal when edit button is clicked', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Main Checking');

      const editButtons = screen.getAllByText('edit');
      await user.click(editButtons[0]);

      expect(screen.getByText('Edit Account')).toBeInTheDocument();
      expect(screen.getByLabelText('Account Name')).toBeInTheDocument();
    });

    it('should pre-fill form with account data', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Main Checking');

      const editButtons = screen.getAllByText('edit');
      await user.click(editButtons[0]);

      expect(screen.getByLabelText('Account Name')).toHaveValue('Main Checking');
    });

    it('should call updateAccount on save', async () => {
      const { updateAccountSpy } = makeSut();
      const user = userEvent.setup();

      vi.spyOn(updateAccountSpy, 'execute').mockResolvedValueOnce(accounts[0]);

      await screen.findByText('Main Checking');

      const editButtons = screen.getAllByText('edit');
      await user.click(editButtons[0]);

      await user.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(updateAccountSpy.execute).toHaveBeenCalledOnce();
        expect(updateAccountSpy.execute).toHaveBeenCalledWith(
          'acc-1',
          expect.objectContaining({
            accountName: 'Main Checking',
          }),
        );
      });
    });

    it('should show Saving... text while submitting', async () => {
      const { updateAccountSpy } = makeSut();
      const user = userEvent.setup();

      let resolveUpdate: (value: BankAccount) => void;
      vi.spyOn(updateAccountSpy, 'execute').mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveUpdate = resolve;
          }),
      );

      await screen.findByText('Main Checking');

      const editButtons = screen.getAllByText('edit');
      await user.click(editButtons[0]);

      await user.click(screen.getByText('Save Changes'));

      expect(await screen.findByText('Saving...')).toBeInTheDocument();

      resolveUpdate!(accounts[0]);
    });

    it('should close edit modal when Cancel is clicked', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Main Checking');

      const editButtons = screen.getAllByText('edit');
      await user.click(editButtons[0]);

      await user.click(screen.getByText('Cancel'));

      expect(screen.queryByText('Edit Account')).not.toBeInTheDocument();
    });
  });

  describe('delete account confirmation', () => {
    it('should open delete confirmation when delete button is clicked', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Main Checking');

      const deleteButtons = screen.getAllByText('delete');
      await user.click(deleteButtons[0]);

      expect(screen.getByText('Delete Account')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    });

    it('should call deleteAccount on confirm', async () => {
      const { deleteAccountSpy, loadAccountsSpy } = makeSut();
      const user = userEvent.setup();

      vi.spyOn(deleteAccountSpy, 'execute').mockResolvedValueOnce(undefined);

      await screen.findByText('Main Checking');

      const deleteButtons = screen.getAllByText('delete');
      await user.click(deleteButtons[0]);

      await user.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(deleteAccountSpy.execute).toHaveBeenCalledWith('acc-1');
      });

      await waitFor(() => {
        expect(loadAccountsSpy.execute).toHaveBeenCalledTimes(2);
      });
    });

    it('should show Deleting... text while deleting', async () => {
      const { deleteAccountSpy } = makeSut();
      const user = userEvent.setup();

      let resolveDelete: (value: void) => void;
      vi.spyOn(deleteAccountSpy, 'execute').mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveDelete = resolve;
          }),
      );

      await screen.findByText('Main Checking');

      const deleteButtons = screen.getAllByText('delete');
      await user.click(deleteButtons[0]);

      await user.click(screen.getByText('Delete'));

      expect(await screen.findByText('Deleting...')).toBeInTheDocument();

      resolveDelete!();
    });

    it('should close delete modal when Cancel is clicked', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Main Checking');

      const deleteButtons = screen.getAllByText('delete');
      await user.click(deleteButtons[0]);

      await user.click(screen.getByText('Cancel'));

      expect(screen.queryByText('Delete Account')).not.toBeInTheDocument();
    });
  });

  describe('account card edge cases', () => {
    it('should fall back to account_balance icon for unknown account types', async () => {
      const customAccounts: BankAccount[] = [
        {
          id: 'acc-3',
          institutionId: 'inst-1',
          accountName: 'Unknown Type Account',
          currencyCode: 'USD',
          balance: 5000,
          accountType: 'UNKNOWN_TYPE' as BankAccount['accountType'],
          balanceUpdatedAt: '2026-01-01T00:00:00Z',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ];

      makeSut({ accounts: customAccounts });

      expect(await screen.findByText('Unknown Type Account')).toBeInTheDocument();
    });

    it('should fall back to institutionId when institution is not in the map', async () => {
      const customAccounts: BankAccount[] = [
        {
          id: 'acc-4',
          institutionId: 'inst-unknown',
          accountName: 'Orphan Account',
          currencyCode: 'EUR',
          balance: 2000,
          accountType: 'CHECKING',
          balanceUpdatedAt: '2026-01-01T00:00:00Z',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ];

      makeSut({ accounts: customAccounts });

      expect(await screen.findByText('inst-unknown')).toBeInTheDocument();
    });

    it('should open create modal from empty state Add Account button', async () => {
      makeSut({ accounts: [], overviewData: emptyOverview });
      const user = userEvent.setup();

      const addButtons = await screen.findAllByText('Add Account');
      const emptyStateButton = addButtons[addButtons.length - 1].closest('button')!;
      await user.click(emptyStateButton);

      expect(screen.getByLabelText('Institution')).toBeInTheDocument();
    });

    it('should close create modal via close icon button', async () => {
      makeSut();
      const user = userEvent.setup();

      const addButtons = await screen.findAllByText('Add Account');
      await user.click(addButtons[0].closest('button')!);

      expect(screen.getByLabelText('Institution')).toBeInTheDocument();

      const closeButton = screen.getByText('close').closest('button')!;
      await user.click(closeButton);

      expect(screen.queryByLabelText('Institution')).not.toBeInTheDocument();
    });

    it('should close edit modal via close icon button', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Main Checking');

      const editButtons = screen.getAllByText('edit');
      await user.click(editButtons[0]);

      expect(screen.getByText('Edit Account')).toBeInTheDocument();

      const closeButton = screen.getByText('close').closest('button')!;
      await user.click(closeButton);

      expect(screen.queryByText('Edit Account')).not.toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should display error message when loading fails', async () => {
      const loadAccountsSpy: ILoadAccounts = { execute: vi.fn() };
      const createAccountSpy: ICreateAccount = { execute: vi.fn() };
      const updateAccountSpy: IUpdateAccount = { execute: vi.fn() };
      const deleteAccountSpy: IDeleteAccount = { execute: vi.fn() };
      const loadAccountOverviewSpy: ILoadAccountOverview = { execute: vi.fn() };
      const loadInstitutionsSpy: ILoadInstitutions = { execute: vi.fn() };

      vi.spyOn(loadAccountsSpy, 'execute').mockRejectedValue(new Error('network error'));
      vi.spyOn(loadAccountOverviewSpy, 'execute').mockRejectedValue(new Error('network error'));
      vi.spyOn(loadInstitutionsSpy, 'execute').mockRejectedValue(new Error('network error'));

      renderWithI18n(
        <AccountsOverviewPage
          loadAccounts={loadAccountsSpy}
          createAccount={createAccountSpy}
          updateAccount={updateAccountSpy}
          deleteAccount={deleteAccountSpy}
          loadAccountOverview={loadAccountOverviewSpy}
          loadInstitutions={loadInstitutionsSpy}
        />,
      );

      expect(
        await screen.findByText('Failed to load accounts. Please try again.'),
      ).toBeInTheDocument();
    });

    it('should display error message when delete fails', async () => {
      const { deleteAccountSpy } = makeSut();
      const user = userEvent.setup();

      vi.spyOn(deleteAccountSpy, 'execute').mockRejectedValueOnce(new Error('delete failed'));

      await screen.findByText('Main Checking');

      const deleteButtons = screen.getAllByText('delete');
      await user.click(deleteButtons[0]);

      await user.click(screen.getByText('Delete'));

      expect(await screen.findByText('Failed to delete account.')).toBeInTheDocument();
    });

    it('should display error message when create fails', async () => {
      const { createAccountSpy } = makeSut();
      const user = userEvent.setup();

      vi.spyOn(createAccountSpy, 'execute').mockRejectedValueOnce(new Error('create failed'));

      const addButtons = await screen.findAllByText('Add Account');
      await user.click(addButtons[0].closest('button')!);

      await user.selectOptions(screen.getByLabelText('Institution'), 'inst-1');
      await user.type(screen.getByLabelText('Account Name'), 'Failing Account');
      await user.type(screen.getByLabelText('Currency Code'), 'USD');
      await user.click(screen.getByText('Create Account'));

      expect(await screen.findByText('Failed to create account.')).toBeInTheDocument();
    });

    it('should display error message when update fails', async () => {
      const { updateAccountSpy } = makeSut();
      const user = userEvent.setup();

      vi.spyOn(updateAccountSpy, 'execute').mockRejectedValueOnce(new Error('update failed'));

      await screen.findByText('Main Checking');

      const editButtons = screen.getAllByText('edit');
      await user.click(editButtons[0]);

      await user.click(screen.getByText('Save Changes'));

      expect(await screen.findByText('Failed to update account.')).toBeInTheDocument();
    });
  });
});

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
import type { CustomerSchema } from '@/domain/models/profile/Profile';
import type { IDeleteAccount } from '@/domain/usecases/profile/IDeleteAccount';
import type { ILoadProfile } from '@/domain/usecases/profile/ILoadProfile';
import type { IUpdateProfile } from '@/domain/usecases/profile/IUpdateProfile';
import { AuthProvider } from '@/presentation/contexts/AuthContext';
import { renderWithI18n } from '@/test/i18n';
import { UserProfilePage } from './UserProfilePage';

const profileData: CustomerSchema = {
  id: 'user-1',
  email: 'john@example.com',
  name: 'John Doe',
  language: 'en-US',
  avatarUrl: null,
  verifiedAt: '2026-01-15T00:00:00Z',
  createdAt: '2025-03-01T00:00:00Z',
};

const profileWithoutName: CustomerSchema = {
  ...profileData,
  name: null,
};

const profilePtBr: CustomerSchema = {
  ...profileData,
  language: 'pt-BR',
};

function renderWithRouter(
  loadProfile: ILoadProfile,
  updateProfile: IUpdateProfile,
  deleteAccount: IDeleteAccount,
) {
  const rootRoute = createRootRoute();
  const profileRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/profile',
    component: () => (
      <UserProfilePage
        loadProfile={loadProfile}
        updateProfile={updateProfile}
        deleteAccount={deleteAccount}
      />
    ),
  });
  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: () => <div>Login Page</div>,
  });
  const routeTree = rootRoute.addChildren([profileRoute, loginRoute]);
  const memoryHistory = createMemoryHistory({ initialEntries: ['/profile'] });
  const router = createRouter({ routeTree, history: memoryHistory });
  renderWithI18n(
    <AuthProvider>
      {/* biome-ignore lint/suspicious/noExplicitAny: test router type mismatch with register */}
      <RouterProvider router={router as any} />
    </AuthProvider>,
  );
  return { router };
}

async function waitForProfileLoaded() {
  await screen.findByText('User Profile');
}

describe('UserProfilePage', () => {
  const makeSut = (overrides?: { loadProfile?: ILoadProfile }) => {
    localStorage.clear();
    localStorage.setItem('nosko_access_token', 'test-token');
    const loadProfileSpy: ILoadProfile = {
      execute: vi.fn().mockResolvedValue(profileData),
    };
    const updateProfileSpy: IUpdateProfile = { execute: vi.fn() };
    const deleteAccountSpy: IDeleteAccount = { execute: vi.fn() };
    const loadProfile = overrides?.loadProfile ?? loadProfileSpy;
    renderWithRouter(loadProfile, updateProfileSpy, deleteAccountSpy);
    return { loadProfileSpy: loadProfile, updateProfileSpy, deleteAccountSpy };
  };

  describe('loading state', () => {
    it('should show loading spinner while fetching profile', async () => {
      const loadProfileSpy: ILoadProfile = {
        execute: vi.fn().mockReturnValue(new Promise(() => {})),
      };
      makeSut({ loadProfile: loadProfileSpy });

      expect(await screen.findByText('progress_activity')).toBeInTheDocument();
    });
  });

  describe('render', () => {
    it('should display profile heading after loading', async () => {
      makeSut();

      expect(await screen.findByText('User Profile')).toBeInTheDocument();
    });

    it('should display user email', async () => {
      makeSut();

      await waitForProfileLoaded();
      const emails = screen.getAllByText('john@example.com');
      expect(emails.length).toBeGreaterThanOrEqual(1);
    });

    it('should display user name in header card', async () => {
      makeSut();

      await waitForProfileLoaded();
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('John Doe');
    });

    it('should call loadProfile on mount', async () => {
      const { loadProfileSpy } = makeSut();

      await waitForProfileLoaded();

      expect(loadProfileSpy.execute).toHaveBeenCalledOnce();
    });

    it('should display language in view mode', async () => {
      makeSut();

      await waitForProfileLoaded();
      expect(screen.getByText('English (US)')).toBeInTheDocument();
    });

    it('should display email as heading when name is null', async () => {
      const loadProfileSpy: ILoadProfile = {
        execute: vi.fn().mockResolvedValue(profileWithoutName),
      };
      makeSut({ loadProfile: loadProfileSpy });

      await waitForProfileLoaded();
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('john@example.com');
    });

    it('should display dash for name in view mode when name is null', async () => {
      const loadProfileSpy: ILoadProfile = {
        execute: vi.fn().mockResolvedValue(profileWithoutName),
      };
      makeSut({ loadProfile: loadProfileSpy });

      await waitForProfileLoaded();
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should display Português (BR) when language is pt-BR', async () => {
      const loadProfileSpy: ILoadProfile = {
        execute: vi.fn().mockResolvedValue(profilePtBr),
      };
      makeSut({ loadProfile: loadProfileSpy });

      await waitForProfileLoaded();
      expect(screen.getByText('Português (BR)')).toBeInTheDocument();
    });

    it('should show error when loadProfile fails', async () => {
      const loadProfileSpy: ILoadProfile = {
        execute: vi.fn().mockRejectedValue(new Error('fail')),
      };
      makeSut({ loadProfile: loadProfileSpy });

      expect(await screen.findByText('Failed to load profile.')).toBeInTheDocument();
    });
  });

  describe('edit form', () => {
    const clickEdit = async () => {
      const user = userEvent.setup();
      await waitForProfileLoaded();
      const editButton = screen.getByRole('button', { name: /Edit/i });
      await user.click(editButton);
      return user;
    };

    it('should show edit form when Edit button is clicked', async () => {
      makeSut();

      await clickEdit();

      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Language')).toBeInTheDocument();
    });

    it('should pre-fill form with current profile data', async () => {
      makeSut();

      await clickEdit();

      expect(screen.getByLabelText('Name')).toHaveValue('John Doe');
      expect(screen.getByLabelText('Language')).toHaveValue('en-US');
    });

    it('should reset form with empty name when profile name is null and Cancel is clicked', async () => {
      const loadProfileSpy: ILoadProfile = {
        execute: vi.fn().mockResolvedValue(profileWithoutName),
      };
      makeSut({ loadProfile: loadProfileSpy });
      const user = userEvent.setup();

      await waitForProfileLoaded();
      await user.click(screen.getByRole('button', { name: /Edit/i }));
      const nameInput = screen.getByLabelText('Name');
      await user.type(nameInput, 'Temporary');
      await user.click(screen.getByRole('button', { name: /Cancel/i }));

      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should hide edit form when Cancel is clicked', async () => {
      makeSut();

      const user = await clickEdit();
      expect(screen.getByLabelText('Name')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /Cancel/i }));
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    });
  });

  describe('profile update', () => {
    it('should call updateProfile with form data on submit', async () => {
      const { updateProfileSpy } = makeSut();
      const user = userEvent.setup();
      const updatedProfile = { ...profileData, name: 'Jane Doe' };
      vi.spyOn(updateProfileSpy, 'execute').mockResolvedValueOnce(updatedProfile);

      await waitForProfileLoaded();
      await user.click(screen.getByRole('button', { name: /Edit/i }));

      const nameInput = screen.getByLabelText('Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Doe');
      await user.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(updateProfileSpy.execute).toHaveBeenCalledWith({
          name: 'Jane Doe',
          language: 'en-US',
        });
      });
    });

    it('should show success message after update', async () => {
      const { updateProfileSpy } = makeSut();
      const user = userEvent.setup();
      vi.spyOn(updateProfileSpy, 'execute').mockResolvedValueOnce(profileData);

      await waitForProfileLoaded();
      await user.click(screen.getByRole('button', { name: /Edit/i }));
      await user.click(screen.getByRole('button', { name: /Save Changes/i }));

      expect(await screen.findByText('Profile updated successfully.')).toBeInTheDocument();
    });

    it('should show error message when update fails', async () => {
      const { updateProfileSpy } = makeSut();
      const user = userEvent.setup();
      vi.spyOn(updateProfileSpy, 'execute').mockRejectedValueOnce(new Error('fail'));

      await waitForProfileLoaded();
      await user.click(screen.getByRole('button', { name: /Edit/i }));
      await user.click(screen.getByRole('button', { name: /Save Changes/i }));

      expect(await screen.findByText('Failed to update profile.')).toBeInTheDocument();
    });

    it('should disable submit button while saving', async () => {
      const { updateProfileSpy } = makeSut();
      const user = userEvent.setup();
      let resolveUpdate: (value: CustomerSchema) => void;
      vi.spyOn(updateProfileSpy, 'execute').mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveUpdate = resolve;
          }),
      );

      await waitForProfileLoaded();
      await user.click(screen.getByRole('button', { name: /Edit/i }));
      await user.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Saving/i })).toBeDisabled();
      });

      resolveUpdate!(profileData);
    });
  });

  describe('delete account', () => {
    it('should show delete confirmation when Delete Account is clicked', async () => {
      makeSut();
      const user = userEvent.setup();

      await waitForProfileLoaded();
      await user.click(screen.getByRole('button', { name: /Delete Account/i }));

      expect(screen.getByRole('button', { name: /Yes, Delete My Account/i })).toBeInTheDocument();
    });

    it('should hide confirmation when Cancel is clicked', async () => {
      makeSut();
      const user = userEvent.setup();

      await waitForProfileLoaded();
      await user.click(screen.getByRole('button', { name: /Delete Account/i }));
      expect(screen.getByRole('button', { name: /Yes, Delete My Account/i })).toBeInTheDocument();

      const cancelButtons = screen.getAllByRole('button', { name: /Cancel/i });
      await user.click(cancelButtons[cancelButtons.length - 1]);
      expect(
        screen.queryByRole('button', { name: /Yes, Delete My Account/i }),
      ).not.toBeInTheDocument();
    });

    it('should call deleteAccount on confirmation', async () => {
      const { deleteAccountSpy } = makeSut();
      const user = userEvent.setup();
      vi.spyOn(deleteAccountSpy, 'execute').mockResolvedValueOnce();

      await waitForProfileLoaded();
      await user.click(screen.getByRole('button', { name: /Delete Account/i }));
      await user.click(screen.getByRole('button', { name: /Yes, Delete My Account/i }));

      await waitFor(() => {
        expect(deleteAccountSpy.execute).toHaveBeenCalledOnce();
      });
    });

    it('should show error when delete fails', async () => {
      const { deleteAccountSpy } = makeSut();
      const user = userEvent.setup();
      vi.spyOn(deleteAccountSpy, 'execute').mockRejectedValueOnce(new Error('fail'));

      await waitForProfileLoaded();
      await user.click(screen.getByRole('button', { name: /Delete Account/i }));
      await user.click(screen.getByRole('button', { name: /Yes, Delete My Account/i }));

      expect(await screen.findByText('Failed to delete account.')).toBeInTheDocument();
    });

    it('should disable delete button while deleting', async () => {
      const { deleteAccountSpy } = makeSut();
      const user = userEvent.setup();
      let resolveDelete: () => void;
      vi.spyOn(deleteAccountSpy, 'execute').mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveDelete = resolve;
          }),
      );

      await waitForProfileLoaded();
      await user.click(screen.getByRole('button', { name: /Delete Account/i }));
      await user.click(screen.getByRole('button', { name: /Yes, Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Deleting/i })).toBeDisabled();
      });

      resolveDelete!();
    });
  });
});

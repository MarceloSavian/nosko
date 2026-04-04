import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/presentation/contexts/AuthContext';
import { renderWithI18n } from '@/test/i18n';
import { AppLayout } from './AppLayout';

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
    Link: ({
      to,
      children,
      ...props
    }: {
      to: string;
      children: React.ReactNode;
      className?: string;
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useMatchRoute: () => () => false,
  };
});

afterEach(() => {
  localStorage.clear();
});

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AppLayout', () => {
  describe('auth guard', () => {
    it('should render Navigate to /login when not authenticated', () => {
      renderWithI18n(
        <TestWrapper>
          <AppLayout />
        </TestWrapper>,
      );

      const navigate = screen.getByTestId('navigate');
      expect(navigate).toHaveTextContent('/login');
    });

    it('should render layout when authenticated', () => {
      localStorage.setItem('nosko_access_token', 'test-token');

      renderWithI18n(
        <TestWrapper>
          <AppLayout />
        </TestWrapper>,
      );

      expect(screen.getByTestId('outlet')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should display all nav items', () => {
      localStorage.setItem('nosko_access_token', 'test-token');

      renderWithI18n(
        <TestWrapper>
          <AppLayout />
        </TestWrapper>,
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Joint Accounts')).toBeInTheDocument();
      expect(screen.getByText('Savings Goals')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('should display Nosko branding', () => {
      localStorage.setItem('nosko_access_token', 'test-token');

      renderWithI18n(
        <TestWrapper>
          <AppLayout />
        </TestWrapper>,
      );

      expect(screen.getByText('Nosko')).toBeInTheDocument();
    });
  });

  describe('logout', () => {
    it('should clear token on sign out click', async () => {
      localStorage.setItem('nosko_access_token', 'test-token');
      const user = userEvent.setup();

      renderWithI18n(
        <TestWrapper>
          <AppLayout />
        </TestWrapper>,
      );

      const signOutButton = screen.getByText('Sign Out').closest('button') as HTMLElement;
      await user.click(signOutButton);

      expect(localStorage.getItem('nosko_access_token')).toBeNull();
      await waitFor(() => {
        expect(screen.getByTestId('navigate')).toHaveTextContent('/login');
      });
    });
  });

  describe('content', () => {
    it('should render Outlet for child routes', () => {
      localStorage.setItem('nosko_access_token', 'test-token');

      renderWithI18n(
        <TestWrapper>
          <AppLayout />
        </TestWrapper>,
      );

      expect(screen.getByTestId('outlet')).toHaveTextContent('Outlet Content');
    });
  });
});

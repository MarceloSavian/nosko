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

  describe('collapsible sidebar', () => {
    it('should render sidebar expanded by default with nav labels visible', () => {
      localStorage.setItem('nosko_access_token', 'test-token');

      renderWithI18n(
        <TestWrapper>
          <AppLayout />
        </TestWrapper>,
      );

      expect(screen.getByText('Nosko')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Joint Accounts')).toBeInTheDocument();
      expect(screen.getByText('Savings Goals')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Collapse')).toBeInTheDocument();
    });

    it('should collapse sidebar and hide nav labels when toggle is clicked', async () => {
      localStorage.setItem('nosko_access_token', 'test-token');
      const user = userEvent.setup();

      renderWithI18n(
        <TestWrapper>
          <AppLayout />
        </TestWrapper>,
      );

      const collapseButton = screen.getByText('Collapse').closest('button') as HTMLElement;
      await user.click(collapseButton);

      expect(screen.queryByText('Nosko')).not.toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Joint Accounts')).not.toBeInTheDocument();
      expect(screen.queryByText('Savings Goals')).not.toBeInTheDocument();
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
      expect(screen.queryByText('Collapse')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    });

    it('should expand sidebar when toggle is clicked again', async () => {
      localStorage.setItem('nosko_access_token', 'test-token');
      const user = userEvent.setup();

      renderWithI18n(
        <TestWrapper>
          <AppLayout />
        </TestWrapper>,
      );

      const collapseButton = screen.getByText('Collapse').closest('button') as HTMLElement;
      await user.click(collapseButton);

      const expandButtons = screen.getAllByRole('button');
      const expandButton = expandButtons[expandButtons.length - 1];
      await user.click(expandButton!);

      expect(screen.getByText('Nosko')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Joint Accounts')).toBeInTheDocument();
      expect(screen.getByText('Collapse')).toBeInTheDocument();
    });

    it('should keep navigation icons visible when collapsed', async () => {
      localStorage.setItem('nosko_access_token', 'test-token');
      const user = userEvent.setup();

      renderWithI18n(
        <TestWrapper>
          <AppLayout />
        </TestWrapper>,
      );

      const collapseButton = screen.getByText('Collapse').closest('button') as HTMLElement;
      await user.click(collapseButton);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(5);
      for (const link of links) {
        expect(link.querySelector('.material-symbols-outlined')).toBeInTheDocument();
      }
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

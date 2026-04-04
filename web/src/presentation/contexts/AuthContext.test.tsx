import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

function TestComponent() {
  const { isAuthenticated, accessToken, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="token">{accessToken ?? 'null'}</span>
      <button type="button" onClick={() => login('test-token')}>
        Login
      </button>
      <button type="button" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should be unauthenticated when no token in localStorage', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('token')).toHaveTextContent('null');
    });

    it('should be authenticated when token exists in localStorage', () => {
      localStorage.setItem('nosko_access_token', 'existing-token');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('token')).toHaveTextContent('existing-token');
    });
  });

  describe('login', () => {
    it('should set token and become authenticated', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Login' }));

      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('token')).toHaveTextContent('test-token');
      expect(localStorage.getItem('nosko_access_token')).toBe('test-token');
    });
  });

  describe('logout', () => {
    it('should clear token and become unauthenticated', async () => {
      localStorage.setItem('nosko_access_token', 'existing-token');
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');

      await user.click(screen.getByRole('button', { name: 'Logout' }));

      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('token')).toHaveTextContent('null');
      expect(localStorage.getItem('nosko_access_token')).toBeNull();
    });
  });

  describe('useAuth outside provider', () => {
    it('should throw error when used outside AuthProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<TestComponent />)).toThrow(
        'useAuth must be used within an AuthProvider',
      );

      consoleSpy.mockRestore();
    });
  });
});

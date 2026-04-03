import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { router } from './router';

const createTestRouter = (initialPath: string) => {
  const memoryHistory = createMemoryHistory({ initialEntries: [initialPath] });
  return createRouter({
    routeTree: router.routeTree,
    history: memoryHistory,
  });
};

describe('App', () => {
  describe('landing route', () => {
    it('should render the landing page at /', async () => {
      const testRouter = createTestRouter('/');
      // biome-ignore lint/suspicious/noExplicitAny: test router type mismatch with register
      render(<RouterProvider router={testRouter as any} />);
      expect(await screen.findByText('Finance for')).toBeInTheDocument();
    });
  });

  describe('login route', () => {
    it('should render the login page at /login', async () => {
      const testRouter = createTestRouter('/login');
      // biome-ignore lint/suspicious/noExplicitAny: test router type mismatch with register
      render(<RouterProvider router={testRouter as any} />);
      expect(await screen.findByText('Welcome back')).toBeInTheDocument();
    });
  });
});

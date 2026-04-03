import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import { LandingPage } from '@/presentation/pages/landing/LandingPage';
import { LoginPage } from '@/presentation/pages/login/LoginPage';

const rootRoute = createRootRoute({
  component: Outlet,
});

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const routeTree = rootRoute.addChildren([landingRoute, loginRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

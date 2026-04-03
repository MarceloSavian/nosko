import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import { AppLayout } from '@/presentation/components/AppLayout';
import { ConfirmEmailPage } from '@/presentation/pages/confirm-email/ConfirmEmailPage';
import { DashboardPage } from '@/presentation/pages/dashboard/DashboardPage';
import { LandingPage } from '@/presentation/pages/landing/LandingPage';
import { LoginPage } from '@/presentation/pages/login/LoginPage';
import { SignUpPage } from '@/presentation/pages/signup/SignUpPage';

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

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: SignUpPage,
});

const confirmEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/confirm-email',
  component: ConfirmEmailPage,
});

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: AppLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/dashboard',
  component: DashboardPage,
});

const accountsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/accounts',
  component: () => <div>Accounts</div>,
});

const plannerRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/planner',
  component: () => <div>Planner</div>,
});

const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/profile',
  component: () => <div>Profile</div>,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  loginRoute,
  signupRoute,
  confirmEmailRoute,
  appLayoutRoute.addChildren([dashboardRoute, accountsRoute, plannerRoute, profileRoute]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

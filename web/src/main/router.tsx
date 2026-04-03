import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import { ConfirmEmailPage } from '@/presentation/pages/confirm-email/ConfirmEmailPage';
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

const routeTree = rootRoute.addChildren([landingRoute, loginRoute, signupRoute, confirmEmailRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

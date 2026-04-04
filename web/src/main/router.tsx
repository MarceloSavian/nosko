import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useSearch,
} from '@tanstack/react-router';
import { AppLayout } from '@/presentation/components/AppLayout';
import { AccountsOverviewPage } from '@/presentation/pages/accounts/AccountsOverviewPage';
import { ConfirmEmailPage } from '@/presentation/pages/confirm-email/ConfirmEmailPage';
import { DashboardPage } from '@/presentation/pages/dashboard/DashboardPage';
import { LandingPage } from '@/presentation/pages/landing/LandingPage';
import { LoginPage } from '@/presentation/pages/login/LoginPage';
import { ContributionRulesPage } from '@/presentation/pages/partner-setup/ContributionRulesPage';
import { InvitePartnerPage } from '@/presentation/pages/partner-setup/InvitePartnerPage';
import { SelectSharedAccountsPage } from '@/presentation/pages/partner-setup/SelectSharedAccountsPage';
import { FinancialPlannerPage } from '@/presentation/pages/planner/FinancialPlannerPage';
import { UserProfilePage } from '@/presentation/pages/profile/UserProfilePage';
import { SignUpPage } from '@/presentation/pages/signup/SignUpPage';
import { resendVerification, signUp, verifyEmail } from './factories/auth';

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
  component: () => <SignUpPage signUp={signUp} />,
});

type ConfirmEmailSearch = {
  email: string;
};

function ConfirmEmailWrapper() {
  const { email } = useSearch({ from: '/confirm-email' });
  return (
    <ConfirmEmailPage
      email={email}
      verifyEmail={verifyEmail}
      resendVerification={resendVerification}
    />
  );
}

const confirmEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/confirm-email',
  component: ConfirmEmailWrapper,
  validateSearch: (search: Record<string, unknown>): ConfirmEmailSearch => ({
    email: (search.email as string) ?? '',
  }),
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
  component: AccountsOverviewPage,
});

const plannerRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/planner',
  component: FinancialPlannerPage,
});

const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/profile',
  component: UserProfilePage,
});

const partnerSetupInviteRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/partner-setup/invite',
  component: InvitePartnerPage,
});

const partnerSetupAccountsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/partner-setup/select-accounts',
  component: SelectSharedAccountsPage,
});

const partnerSetupRulesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/partner-setup/contribution-rules',
  component: ContributionRulesPage,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  loginRoute,
  signupRoute,
  confirmEmailRoute,
  appLayoutRoute.addChildren([
    dashboardRoute,
    accountsRoute,
    plannerRoute,
    profileRoute,
    partnerSetupInviteRoute,
    partnerSetupAccountsRoute,
    partnerSetupRulesRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

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
import { ForgotPasswordPage } from '@/presentation/pages/forgot-password/ForgotPasswordPage';
import { LandingPage } from '@/presentation/pages/landing/LandingPage';
import { LoginPage } from '@/presentation/pages/login/LoginPage';
import { ContributionRulesPage } from '@/presentation/pages/partner-setup/ContributionRulesPage';
import { InvitePartnerPage } from '@/presentation/pages/partner-setup/InvitePartnerPage';
import { SelectSharedAccountsPage } from '@/presentation/pages/partner-setup/SelectSharedAccountsPage';
import { FinancialPlannerPage } from '@/presentation/pages/planner/FinancialPlannerPage';
import { UserProfilePage } from '@/presentation/pages/profile/UserProfilePage';
import { ResetPasswordPage } from '@/presentation/pages/reset-password/ResetPasswordPage';
import { SignUpPage } from '@/presentation/pages/signup/SignUpPage';
import { TransactionsPage } from '@/presentation/pages/transactions/TransactionsPage';
import {
  createAccount,
  deleteAccount as deleteBankAccount,
  loadAccountOverview,
  loadAccounts,
  loadInstitutions,
  updateAccount,
} from './factories/account';
import { login, resendVerification, signUp, verifyEmail } from './factories/auth';
import {
  addBudgetItem,
  createBudgetCategory,
  createBudgetPlan,
  createJointBudgetPlan,
  deleteBudgetCategory,
  deleteBudgetItem,
  deleteBudgetPlan,
  deleteJointBudgetPlan,
  loadBudgetCategories,
  loadBudgetPlan,
  loadBudgetSummary,
  loadJointBudgetPlan,
  updateBudgetItem,
} from './factories/budget';
import { requestPasswordReset, resetPassword } from './factories/password-reset';
import { deleteAccount, loadProfile, updateProfile } from './factories/profile';
import {
  createTransaction,
  deleteTransaction,
  loadTransactions,
  updateTransaction,
} from './factories/transaction';

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
  component: () => <LoginPage loginUseCase={login} />,
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

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: () => <ForgotPasswordPage requestPasswordReset={requestPasswordReset} />,
});

type ResetPasswordSearch = {
  email: string;
};

function ResetPasswordWrapper() {
  const { email } = useSearch({ from: '/reset-password' });
  return <ResetPasswordPage email={email} resetPassword={resetPassword} />;
}

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  component: ResetPasswordWrapper,
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => ({
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
  component: () => (
    <AccountsOverviewPage
      loadAccounts={loadAccounts}
      createAccount={createAccount}
      updateAccount={updateAccount}
      deleteAccount={deleteBankAccount}
      loadAccountOverview={loadAccountOverview}
      loadInstitutions={loadInstitutions}
    />
  ),
});

const plannerRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/planner',
  component: () => (
    <FinancialPlannerPage
      loadCategories={loadBudgetCategories}
      createCategory={createBudgetCategory}
      deleteCategory={deleteBudgetCategory}
      loadPlan={loadBudgetPlan}
      createPlan={createBudgetPlan}
      deletePlan={deleteBudgetPlan}
      loadJointPlan={loadJointBudgetPlan}
      createJointPlan={createJointBudgetPlan}
      deleteJointPlan={deleteJointBudgetPlan}
      addItem={addBudgetItem}
      updateItem={updateBudgetItem}
      deleteItem={deleteBudgetItem}
      loadSummary={loadBudgetSummary}
    />
  ),
});

const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/profile',
  component: () => (
    <UserProfilePage
      loadProfile={loadProfile}
      updateProfile={updateProfile}
      deleteAccount={deleteAccount}
    />
  ),
});

const transactionsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/transactions',
  component: () => (
    <TransactionsPage
      loadTransactions={loadTransactions}
      createTransaction={createTransaction}
      updateTransaction={updateTransaction}
      deleteTransaction={deleteTransaction}
    />
  ),
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
  forgotPasswordRoute,
  resetPasswordRoute,
  appLayoutRoute.addChildren([
    dashboardRoute,
    accountsRoute,
    plannerRoute,
    profileRoute,
    transactionsRoute,
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

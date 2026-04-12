import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import { createAdmin, deleteAdmin, listAdmins } from '@/main/factories/admin';
import { login, requestPasswordReset, resetPassword } from '@/main/factories/auth';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '@/main/factories/budget-category';
import { deleteCustomer, listCustomers } from '@/main/factories/customer';
import {
  createInstitution,
  deleteInstitution,
  listInstitutions,
  updateInstitution,
} from '@/main/factories/institution';
import { AdminLayout } from '@/presentation/components/AdminLayout';
import { AdminsPage } from '@/presentation/pages/admins/AdminsPage';
import { BudgetCategoriesPage } from '@/presentation/pages/budget-categories/BudgetCategoriesPage';
import { CustomersPage } from '@/presentation/pages/customers/CustomersPage';
import { ForgotPasswordPage } from '@/presentation/pages/forgot-password/ForgotPasswordPage';
import { InstitutionsPage } from '@/presentation/pages/institutions/InstitutionsPage';
import { LoginPage } from '@/presentation/pages/login/LoginPage';
import { ResetPasswordPage } from '@/presentation/pages/reset-password/ResetPasswordPage';

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: () => <LoginPage loginUseCase={login} />,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: () => <ForgotPasswordPage requestPasswordReset={requestPasswordReset} />,
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  component: () => <ResetPasswordPage resetPassword={resetPassword} />,
});

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: AdminLayout,
});

const customersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/customers',
  component: () => <CustomersPage listCustomers={listCustomers} deleteCustomer={deleteCustomer} />,
});

const institutionsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/institutions',
  component: () => (
    <InstitutionsPage
      listInstitutions={listInstitutions}
      createInstitution={createInstitution}
      updateInstitution={updateInstitution}
      deleteInstitution={deleteInstitution}
    />
  ),
});

const budgetCategoriesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/budget-categories',
  component: () => (
    <BudgetCategoriesPage
      listCategories={listCategories}
      createCategory={createCategory}
      updateCategory={updateCategory}
      deleteCategory={deleteCategory}
    />
  ),
});

const adminsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admins',
  component: () => (
    <AdminsPage listAdmins={listAdmins} createAdmin={createAdmin} deleteAdmin={deleteAdmin} />
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <meta httpEquiv="refresh" content="0;url=/customers" />,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  indexRoute,
  appLayoutRoute.addChildren([
    customersRoute,
    institutionsRoute,
    budgetCategoriesRoute,
    adminsRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

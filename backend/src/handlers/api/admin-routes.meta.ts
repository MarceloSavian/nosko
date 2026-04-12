import { z } from 'zod/v4';
import {
  adminLoginInputSchema,
  adminRequestPasswordResetInputSchema,
  adminResetPasswordInputSchema,
  adminSchema,
  createAdminInputSchema,
} from '../../domain/models/admin/Admin.js';
import {
  budgetCategorySchema,
  createBudgetCategoryInputSchema,
  updateBudgetCategoryInputSchema,
} from '../../domain/models/budget/BudgetCategory.js';
import { customerSchema } from '../../domain/models/customer/Customer.js';
import {
  createInstitutionInputSchema,
  institutionSchema,
  updateInstitutionInputSchema,
} from '../../domain/models/institution/Institution.js';
import type { RouteMeta } from '../../openapi/route-descriptor.js';

export const adminRouteMetas: RouteMeta[] = [
  {
    method: 'post',
    path: '/v1/admin/login',
    summary: 'Admin login',
    tags: ['Admin - Auth'],
    auth: false,
    request: { body: adminLoginInputSchema },
    responses: {
      200: { description: 'Login successful', schema: z.object({ accessToken: z.string() }) },
    },
  },
  {
    method: 'post',
    path: '/v1/admin/request-password-reset',
    summary: 'Request admin password reset',
    tags: ['Admin - Auth'],
    auth: false,
    request: { body: adminRequestPasswordResetInputSchema },
    responses: {
      200: {
        description: 'Reset code sent if email exists',
        schema: z.object({ message: z.string() }),
      },
    },
  },
  {
    method: 'post',
    path: '/v1/admin/reset-password',
    summary: 'Reset admin password',
    tags: ['Admin - Auth'],
    auth: false,
    request: { body: adminResetPasswordInputSchema },
    responses: {
      200: { description: 'Password reset successful', schema: z.object({ message: z.string() }) },
    },
  },
  {
    method: 'get',
    path: '/v1/admin/customers',
    summary: 'List all customers (non-financial data)',
    tags: ['Admin - Customers'],
    auth: true,
    request: {
      query: z.object({
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
      }),
    },
    responses: {
      200: {
        description: 'Paginated customer list',
        schema: z.object({ customers: customerSchema.array(), total: z.number() }),
      },
    },
  },
  {
    method: 'get',
    path: '/v1/admin/customers/{id}',
    summary: 'Get customer by ID',
    tags: ['Admin - Customers'],
    auth: true,
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: { description: 'Customer details', schema: customerSchema },
    },
  },
  {
    method: 'delete',
    path: '/v1/admin/customers/{id}',
    summary: 'Delete customer',
    tags: ['Admin - Customers'],
    auth: true,
    request: { params: z.object({ id: z.string() }) },
    responses: {
      204: { description: 'Customer deleted' },
    },
  },
  {
    method: 'get',
    path: '/v1/admin/institutions',
    summary: 'List all institutions',
    tags: ['Admin - Institutions'],
    auth: true,
    responses: {
      200: { description: 'List of institutions', schema: institutionSchema.array() },
    },
  },
  {
    method: 'post',
    path: '/v1/admin/institutions',
    summary: 'Create institution',
    tags: ['Admin - Institutions'],
    auth: true,
    request: { body: createInstitutionInputSchema },
    responses: {
      201: { description: 'Institution created', schema: institutionSchema },
    },
  },
  {
    method: 'put',
    path: '/v1/admin/institutions/{id}',
    summary: 'Update institution',
    tags: ['Admin - Institutions'],
    auth: true,
    request: { params: z.object({ id: z.string() }), body: updateInstitutionInputSchema },
    responses: {
      200: { description: 'Institution updated', schema: institutionSchema },
    },
  },
  {
    method: 'delete',
    path: '/v1/admin/institutions/{id}',
    summary: 'Delete institution',
    tags: ['Admin - Institutions'],
    auth: true,
    request: { params: z.object({ id: z.string() }) },
    responses: {
      204: { description: 'Institution deleted' },
    },
  },
  {
    method: 'get',
    path: '/v1/admin/budget-categories',
    summary: 'List all budget categories',
    tags: ['Admin - Budget Categories'],
    auth: true,
    responses: {
      200: { description: 'List of categories', schema: budgetCategorySchema.array() },
    },
  },
  {
    method: 'post',
    path: '/v1/admin/budget-categories',
    summary: 'Create system budget category',
    tags: ['Admin - Budget Categories'],
    auth: true,
    request: { body: createBudgetCategoryInputSchema },
    responses: {
      201: { description: 'System category created', schema: budgetCategorySchema },
    },
  },
  {
    method: 'put',
    path: '/v1/admin/budget-categories/{id}',
    summary: 'Update budget category',
    tags: ['Admin - Budget Categories'],
    auth: true,
    request: { params: z.object({ id: z.string() }), body: updateBudgetCategoryInputSchema },
    responses: {
      200: { description: 'Category updated', schema: budgetCategorySchema },
    },
  },
  {
    method: 'delete',
    path: '/v1/admin/budget-categories/{id}',
    summary: 'Delete budget category',
    tags: ['Admin - Budget Categories'],
    auth: true,
    request: { params: z.object({ id: z.string() }) },
    responses: {
      204: { description: 'Category deleted' },
    },
  },
  {
    method: 'get',
    path: '/v1/admin/admins',
    summary: 'List all admins',
    tags: ['Admin - Management'],
    auth: true,
    responses: {
      200: { description: 'List of admins', schema: adminSchema.array() },
    },
  },
  {
    method: 'post',
    path: '/v1/admin/admins',
    summary: 'Create new admin',
    tags: ['Admin - Management'],
    auth: true,
    request: { body: createAdminInputSchema },
    responses: {
      201: { description: 'Admin created', schema: adminSchema },
    },
  },
  {
    method: 'delete',
    path: '/v1/admin/admins/{id}',
    summary: 'Delete admin',
    tags: ['Admin - Management'],
    auth: true,
    request: { params: z.object({ id: z.string() }) },
    responses: {
      204: { description: 'Admin deleted' },
    },
  },
];

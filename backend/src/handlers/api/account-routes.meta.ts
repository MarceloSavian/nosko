import {
  accountOverviewSchema,
  bankAccountSchema,
  createBankAccountInputSchema,
  updateBankAccountInputSchema,
} from '../../domain/models/account/Account.js';
import type { RouteMeta } from '../../openapi/route-descriptor.js';

export const accountRouteMetas: RouteMeta[] = [
  {
    method: 'get',
    path: '/v1/accounts',
    summary: 'List all bank accounts',
    tags: ['Accounts'],
    auth: true,
    responses: {
      200: { description: 'List of bank accounts', schema: bankAccountSchema.array() },
    },
  },
  {
    method: 'post',
    path: '/v1/accounts',
    summary: 'Create a bank account',
    tags: ['Accounts'],
    auth: true,
    request: { body: createBankAccountInputSchema },
    responses: {
      201: { description: 'Account created', schema: bankAccountSchema },
      400: { description: 'Validation error' },
    },
  },
  {
    method: 'get',
    path: '/v1/accounts/overview',
    summary: 'Get accounts overview with totals by currency',
    tags: ['Accounts'],
    auth: true,
    responses: {
      200: { description: 'Account overview', schema: accountOverviewSchema },
    },
  },
  {
    method: 'get',
    path: '/v1/accounts/{id}',
    summary: 'Get a bank account by ID',
    tags: ['Accounts'],
    auth: true,
    responses: {
      200: { description: 'Bank account details', schema: bankAccountSchema },
      404: { description: 'Account not found' },
    },
  },
  {
    method: 'put',
    path: '/v1/accounts/{id}',
    summary: 'Update a bank account',
    tags: ['Accounts'],
    auth: true,
    request: { body: updateBankAccountInputSchema },
    responses: {
      200: { description: 'Account updated', schema: bankAccountSchema },
      404: { description: 'Account not found' },
    },
  },
  {
    method: 'delete',
    path: '/v1/accounts/{id}',
    summary: 'Delete a bank account',
    tags: ['Accounts'],
    auth: true,
    responses: {
      204: { description: 'Account deleted' },
      404: { description: 'Account not found' },
    },
  },
];

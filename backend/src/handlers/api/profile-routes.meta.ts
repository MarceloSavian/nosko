import {
  currencyDefaultSchema,
  setCurrencyDefaultsInputSchema,
} from '../../domain/models/currency/Currency.js';
import { customerSchema, updateProfileInputSchema } from '../../domain/models/customer/Customer.js';
import type { RouteMeta } from '../../openapi/route-descriptor.js';

export const profileRouteMetas: RouteMeta[] = [
  {
    method: 'get',
    path: '/v1/me',
    summary: 'Get current user profile',
    tags: ['Profile'],
    auth: true,
    responses: {
      200: { description: 'User profile', schema: customerSchema },
    },
  },
  {
    method: 'put',
    path: '/v1/me',
    summary: 'Update current user profile',
    tags: ['Profile'],
    auth: true,
    request: { body: updateProfileInputSchema },
    responses: {
      200: { description: 'Profile updated', schema: customerSchema },
      400: { description: 'Validation error' },
    },
  },
  {
    method: 'delete',
    path: '/v1/me',
    summary: 'Delete current user account',
    tags: ['Profile'],
    auth: true,
    responses: {
      204: { description: 'Account deleted' },
    },
  },
  {
    method: 'get',
    path: '/v1/me/currencies',
    summary: 'Get currency display defaults',
    tags: ['Profile'],
    auth: true,
    responses: {
      200: { description: 'Currency defaults', schema: currencyDefaultSchema.array() },
    },
  },
  {
    method: 'put',
    path: '/v1/me/currencies',
    summary: 'Set currency display defaults',
    tags: ['Profile'],
    auth: true,
    request: { body: setCurrencyDefaultsInputSchema },
    responses: {
      200: { description: 'Currency defaults updated', schema: currencyDefaultSchema.array() },
      400: { description: 'Validation error' },
    },
  },
];

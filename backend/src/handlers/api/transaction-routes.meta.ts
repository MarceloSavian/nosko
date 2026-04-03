import { z } from 'zod/v4';
import {
  createTransactionInputSchema,
  transactionSchema,
  updateTransactionInputSchema,
} from '../../domain/models/transaction/Transaction.js';
import type { RouteMeta } from '../../openapi/route-descriptor.js';

const paginatedTransactionsSchema = z.object({
  data: transactionSchema.array(),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

export const transactionRouteMetas: RouteMeta[] = [
  {
    method: 'get',
    path: '/v1/transactions',
    summary: 'List transactions with optional filters',
    tags: ['Transactions'],
    auth: true,
    responses: {
      200: { description: 'Paginated list of transactions', schema: paginatedTransactionsSchema },
    },
  },
  {
    method: 'post',
    path: '/v1/transactions',
    summary: 'Create a transaction',
    tags: ['Transactions'],
    auth: true,
    request: { body: createTransactionInputSchema },
    responses: {
      201: { description: 'Transaction created', schema: transactionSchema },
      400: { description: 'Validation error' },
    },
  },
  {
    method: 'put',
    path: '/v1/transactions/{id}',
    summary: 'Update a transaction',
    tags: ['Transactions'],
    auth: true,
    request: { body: updateTransactionInputSchema },
    responses: {
      200: { description: 'Transaction updated', schema: transactionSchema },
      404: { description: 'Transaction not found' },
    },
  },
  {
    method: 'delete',
    path: '/v1/transactions/{id}',
    summary: 'Delete a transaction',
    tags: ['Transactions'],
    auth: true,
    responses: {
      204: { description: 'Transaction deleted' },
      404: { description: 'Transaction not found' },
    },
  },
];

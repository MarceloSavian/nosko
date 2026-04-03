import { z } from 'zod/v4';
import type { RouteMeta } from '../../openapi/route-descriptor.js';

const dashboardDataSchema = z.object({
  yearMonth: z.string(),
  totalSpending: z.number(),
  budgetSummary: z
    .object({
      categoryName: z.string(),
      planned: z.number(),
      actual: z.number(),
    })
    .array(),
  recentTransactions: z
    .object({
      id: z.string(),
      description: z.string().nullable(),
      amount: z.number(),
      transactionDate: z.string(),
    })
    .array(),
});

export const dashboardRouteMetas: RouteMeta[] = [
  {
    method: 'get',
    path: '/v1/dashboard',
    summary: 'Get dashboard with spending overview and recent transactions',
    tags: ['Dashboard'],
    auth: true,
    responses: {
      200: { description: 'Dashboard data', schema: dashboardDataSchema },
    },
  },
];

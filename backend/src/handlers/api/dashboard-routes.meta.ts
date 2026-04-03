import type { RouteMeta } from '../../openapi/route-descriptor.js';

export const dashboardRouteMetas: RouteMeta[] = [
  {
    method: 'get',
    path: '/v1/dashboard',
    summary: 'Get dashboard with spending overview and recent transactions',
    tags: ['Dashboard'],
    auth: true,
    responses: {
      200: { description: 'Dashboard data' },
    },
  },
];

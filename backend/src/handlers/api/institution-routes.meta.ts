import { institutionSchema } from '../../domain/models/institution/Institution.js';
import type { RouteMeta } from '../../openapi/route-descriptor.js';

export const institutionRouteMetas: RouteMeta[] = [
  {
    method: 'get',
    path: '/v1/institutions',
    summary: 'List all financial institutions',
    tags: ['Institutions'],
    auth: true,
    responses: {
      200: { description: 'List of institutions', schema: institutionSchema.array() },
    },
  },
];

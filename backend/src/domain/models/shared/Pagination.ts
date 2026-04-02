import { z } from 'zod';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export const paginationInputSchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).optional().default(DEFAULT_LIMIT),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type PaginationInput = z.infer<typeof paginationInputSchema>;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

import { z } from 'zod/v4';

export const customerSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  language: z.string(),
  avatarUrl: z.string().nullable(),
  verifiedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type CustomerSchema = z.infer<typeof customerSchema>;

export type CustomerListResult = {
  customers: CustomerSchema[];
  total: number;
};

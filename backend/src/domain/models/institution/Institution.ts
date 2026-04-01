import { z } from 'zod';

export const institutionSchema = z.object({
  id: z.string(),
  name: z.string(),
  countryCode: z.string().nullable(),
  logoUrl: z.string().nullable(),
});

export type InstitutionSchema = z.infer<typeof institutionSchema>;

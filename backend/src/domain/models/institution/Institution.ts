import { z } from 'zod/v4';

export const institutionSchema = z.object({
  id: z.string(),
  name: z.string(),
  countryCode: z.string(),
  logoUrl: z.string().nullable(),
});

export type InstitutionSchema = z.infer<typeof institutionSchema>;

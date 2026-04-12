import { z } from 'zod/v4';

export const institutionSchema = z.object({
  id: z.string(),
  name: z.string(),
  countryCode: z.string(),
  logoUrl: z.string().nullable(),
});

export type InstitutionSchema = z.infer<typeof institutionSchema>;

export const createInstitutionInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  countryCode: z.string().length(2, 'Country code must be 2 characters'),
  logoUrl: z.string().nullable().optional(),
});

export type CreateInstitutionInput = z.infer<typeof createInstitutionInputSchema>;

export const updateInstitutionInputSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  countryCode: z.string().length(2).optional(),
  logoUrl: z.string().nullable().optional(),
});

export type UpdateInstitutionInput = z.infer<typeof updateInstitutionInputSchema>;

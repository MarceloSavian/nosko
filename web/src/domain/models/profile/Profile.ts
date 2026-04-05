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

export const updateProfileInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  language: z.enum(['en-US', 'pt-BR']).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

export const currencyDefaultSchema = z.object({
  id: z.string(),
  currencyCode: z.string(),
  displayOrder: z.number(),
});

export type CurrencyDefaultSchema = z.infer<typeof currencyDefaultSchema>;

export const setCurrencyDefaultsInputSchema = z.object({
  currencies: z
    .array(
      z.object({
        currencyCode: z.string().length(3, 'Currency code must be 3 characters'),
        displayOrder: z.number().int().min(0),
      }),
    )
    .min(1, 'At least one currency is required'),
});

export type SetCurrencyDefaultsInput = z.infer<typeof setCurrencyDefaultsInputSchema>;

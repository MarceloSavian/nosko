import { z } from 'zod/v4';

export const currencyDefaultSchema = z.object({
  id: z.string(),
  currencyCode: z.string(),
  displayOrder: z.number(),
});

export type CurrencyDefaultSchema = z.infer<typeof currencyDefaultSchema>;

const currencyItemSchema = z.object({
  currencyCode: z.string().length(3, 'Currency code must be 3 characters'),
  displayOrder: z.number().int().min(0),
});

export const setCurrencyDefaultsInputSchema = z.object({
  currencies: z.array(currencyItemSchema).min(1, 'At least one currency is required'),
});

export type SetCurrencyDefaultsInput = z.infer<typeof setCurrencyDefaultsInputSchema>;

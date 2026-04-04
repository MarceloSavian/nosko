import { z } from 'zod/v4';

export const SupportedLocale = {
  EN_US: 'en-US',
  PT_BR: 'pt-BR',
} as const;

export type SupportedLocale = (typeof SupportedLocale)[keyof typeof SupportedLocale];

const supportedLocaleValues = Object.values(SupportedLocale) as [
  SupportedLocale,
  ...SupportedLocale[],
];

export const supportedLocaleSchema = z.enum(supportedLocaleValues);

export const signupInputSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
  language: supportedLocaleSchema,
});

export type SignupInput = z.infer<typeof signupInputSchema>;

export const signupResultSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  language: z.string(),
  avatarUrl: z.string().nullable(),
  verifiedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type SignupResult = z.infer<typeof signupResultSchema>;

export const loginInputSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const loginResultSchema = z.object({
  accessToken: z.string(),
});

export type LoginResult = z.infer<typeof loginResultSchema>;

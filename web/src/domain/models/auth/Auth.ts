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

export const verifyEmailInputSchema = z.object({
  email: z.email('Invalid email'),
  code: z.string().length(6, 'Code must be 6 digits'),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailInputSchema>;

export const resendVerificationInputSchema = z.object({
  email: z.email('Invalid email'),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationInputSchema>;

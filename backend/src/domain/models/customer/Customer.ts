import { z } from 'zod';

export const signupInputSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type SignupInput = z.infer<typeof signupInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const verifyEmailInputSchema = z.object({
  email: z.string().email('Invalid email'),
  code: z.string().length(6, 'Code must be 6 digits'),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailInputSchema>;

export const customerSchema = z.object({
  id: z.string(),
  email: z.string(),
  verifiedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type CustomerSchema = z.infer<typeof customerSchema>;

export type LoginResult = { accessToken: string };

export const resendVerificationInputSchema = z.object({
  email: z.string().email('Invalid email'),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationInputSchema>;

export const requestPasswordResetInputSchema = z.object({
  email: z.string().email('Invalid email'),
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetInputSchema>;

export const resetPasswordInputSchema = z.object({
  email: z.string().email('Invalid email'),
  code: z.string().length(6, 'Code must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

export const TokenType = {
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  PASSWORD_RESET: 'PASSWORD_RESET',
} as const;

export type TokenType = (typeof TokenType)[keyof typeof TokenType];

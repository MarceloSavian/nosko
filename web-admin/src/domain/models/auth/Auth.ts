import { z } from 'zod/v4';

export const loginInputSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export type LoginResult = { accessToken: string };

export const requestPasswordResetInputSchema = z.object({
  email: z.email('Invalid email'),
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetInputSchema>;

export const resetPasswordInputSchema = z.object({
  email: z.email('Invalid email'),
  code: z.string().length(6, 'Code must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

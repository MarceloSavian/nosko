import { z } from 'zod/v4';

export const adminSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  createdAt: z.string(),
});

export type AdminSchema = z.infer<typeof adminSchema>;

export const createAdminInputSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

export type CreateAdminInput = z.infer<typeof createAdminInputSchema>;

export const adminLoginInputSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export type AdminLoginInput = z.infer<typeof adminLoginInputSchema>;

export const adminRequestPasswordResetInputSchema = z.object({
  email: z.email('Invalid email'),
});

export type AdminRequestPasswordResetInput = z.infer<typeof adminRequestPasswordResetInputSchema>;

export const adminResetPasswordInputSchema = z.object({
  email: z.email('Invalid email'),
  code: z.string().length(6, 'Code must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordInputSchema>;

export type AdminLoginResult = {
  accessToken: string;
  profile: AdminSchema;
};

export const AdminTokenType = {
  PASSWORD_RESET: 'PASSWORD_RESET',
} as const;

export type AdminTokenType = (typeof AdminTokenType)[keyof typeof AdminTokenType];

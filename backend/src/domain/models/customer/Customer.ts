import { z } from 'zod';

export const signupInputSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type SignupInput = z.infer<typeof signupInputSchema>;

export const customerSchema = z.object({
  id: z.string(),
  email: z.string(),
  createdAt: z.string(),
});

export type CustomerSchema = z.infer<typeof customerSchema>;

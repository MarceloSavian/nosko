import { z } from 'zod/v4';
import {
  customerSchema,
  loginInputSchema,
  requestPasswordResetInputSchema,
  resendVerificationInputSchema,
  resetPasswordInputSchema,
  signupInputSchema,
  verifyEmailInputSchema,
} from '../../domain/models/customer/Customer.js';
import type { RouteMeta } from '../../openapi/route-descriptor.js';

const loginResultSchema = z.object({
  accessToken: z.string(),
});

export const customerRouteMetas: RouteMeta[] = [
  {
    method: 'post',
    path: '/v1/signup',
    summary: 'Create a new account',
    tags: ['Auth'],
    auth: false,
    request: { body: signupInputSchema },
    responses: {
      201: { description: 'Account created', schema: customerSchema },
      400: { description: 'Validation error' },
    },
  },
  {
    method: 'post',
    path: '/v1/login',
    summary: 'Authenticate and get access token',
    tags: ['Auth'],
    auth: false,
    request: { body: loginInputSchema },
    responses: {
      200: { description: 'Login successful', schema: loginResultSchema },
      401: { description: 'Invalid credentials' },
    },
  },
  {
    method: 'post',
    path: '/v1/verify-email',
    summary: 'Verify email with 6-digit code',
    tags: ['Auth'],
    auth: false,
    request: { body: verifyEmailInputSchema },
    responses: {
      200: { description: 'Email verified', schema: customerSchema },
      400: { description: 'Invalid or expired code' },
    },
  },
  {
    method: 'post',
    path: '/v1/resend-verification',
    summary: 'Resend email verification code',
    tags: ['Auth'],
    auth: false,
    request: { body: resendVerificationInputSchema },
    responses: {
      200: { description: 'Verification code sent' },
    },
  },
  {
    method: 'post',
    path: '/v1/request-password-reset',
    summary: 'Request a password reset code',
    tags: ['Auth'],
    auth: false,
    request: { body: requestPasswordResetInputSchema },
    responses: {
      200: { description: 'Reset code sent if email exists' },
    },
  },
  {
    method: 'post',
    path: '/v1/reset-password',
    summary: 'Reset password with code',
    tags: ['Auth'],
    auth: false,
    request: { body: resetPasswordInputSchema },
    responses: {
      200: { description: 'Password reset successfully' },
      400: { description: 'Invalid or expired code' },
    },
  },
];

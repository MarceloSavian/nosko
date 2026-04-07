import { RemoteRequestPasswordReset } from '@/data/usecases/password-reset/RemoteRequestPasswordReset';
import { RemoteResetPassword } from '@/data/usecases/password-reset/RemoteResetPassword';
import { HttpClient } from '@/infra/http/HttpClient';
import { RequestPasswordResetGateway } from '@/infra/http/password-reset/RequestPasswordResetGateway';
import { ResetPasswordGateway } from '@/infra/http/password-reset/ResetPasswordGateway';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const httpClient = new HttpClient(API_BASE_URL);

const requestPasswordResetGateway = new RequestPasswordResetGateway(httpClient);
export const requestPasswordReset = new RemoteRequestPasswordReset(requestPasswordResetGateway);

const resetPasswordGateway = new ResetPasswordGateway(httpClient);
export const resetPassword = new RemoteResetPassword(resetPasswordGateway);

import { RemoteLogin } from '@/data/usecases/auth/RemoteLogin';
import { RemoteRequestPasswordReset } from '@/data/usecases/auth/RemoteRequestPasswordReset';
import { RemoteResetPassword } from '@/data/usecases/auth/RemoteResetPassword';
import { LoginGateway } from '@/infra/http/auth/LoginGateway';
import { PasswordResetGateway } from '@/infra/http/auth/PasswordResetGateway';
import { HttpClient } from '@/infra/http/HttpClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const httpClient = new HttpClient(API_BASE_URL);

const loginGateway = new LoginGateway(httpClient);
export const login = new RemoteLogin(loginGateway);

const passwordResetGateway = new PasswordResetGateway(httpClient);
export const requestPasswordReset = new RemoteRequestPasswordReset(passwordResetGateway);
export const resetPassword = new RemoteResetPassword(passwordResetGateway);

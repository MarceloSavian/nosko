import { RemoteLogin } from '@/data/usecases/auth/RemoteLogin';
import { RemoteResendVerification } from '@/data/usecases/auth/RemoteResendVerification';
import { RemoteSignUp } from '@/data/usecases/auth/RemoteSignUp';
import { RemoteVerifyEmail } from '@/data/usecases/auth/RemoteVerifyEmail';
import { LoginGateway } from '@/infra/http/auth/LoginGateway';
import { ResendVerificationGateway } from '@/infra/http/auth/ResendVerificationGateway';
import { SignUpGateway } from '@/infra/http/auth/SignUpGateway';
import { VerifyEmailGateway } from '@/infra/http/auth/VerifyEmailGateway';
import { HttpClient } from '@/infra/http/HttpClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const httpClient = new HttpClient(API_BASE_URL);

const signUpGateway = new SignUpGateway(httpClient);
export const signUp = new RemoteSignUp(signUpGateway);

const loginGateway = new LoginGateway(httpClient);
export const login = new RemoteLogin(loginGateway);

const verifyEmailGateway = new VerifyEmailGateway(httpClient);
export const verifyEmail = new RemoteVerifyEmail(verifyEmailGateway);

const resendVerificationGateway = new ResendVerificationGateway(httpClient);
export const resendVerification = new RemoteResendVerification(resendVerificationGateway);

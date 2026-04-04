import { RemoteLogin } from '@/data/usecases/auth/RemoteLogin';
import { RemoteSignUp } from '@/data/usecases/auth/RemoteSignUp';
import { LoginGateway } from '@/infra/http/auth/LoginGateway';
import { SignUpGateway } from '@/infra/http/auth/SignUpGateway';
import { HttpClient } from '@/infra/http/HttpClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const httpClient = new HttpClient(API_BASE_URL);

const signUpGateway = new SignUpGateway(httpClient);
export const signUp = new RemoteSignUp(signUpGateway);

const loginGateway = new LoginGateway(httpClient);
export const login = new RemoteLogin(loginGateway);

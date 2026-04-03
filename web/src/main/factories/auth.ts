import { RemoteSignUp } from '@/data/usecases/auth/RemoteSignUp';
import { SignUpGateway } from '@/infra/http/auth/SignUpGateway';
import { HttpClient } from '@/infra/http/HttpClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const httpClient = new HttpClient(API_BASE_URL);
const signUpGateway = new SignUpGateway(httpClient);
export const signUp = new RemoteSignUp(signUpGateway);

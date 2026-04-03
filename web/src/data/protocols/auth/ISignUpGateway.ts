import type { SignupResult } from '@/domain/models/auth/Auth';

export type SignUpGatewayInput = {
  email: string;
  password: string;
  name: string;
  language: string;
};

export interface ISignUpGateway {
  signUp(input: SignUpGatewayInput): Promise<SignupResult>;
}

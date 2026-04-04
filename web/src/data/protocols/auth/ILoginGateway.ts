import type { LoginResult } from '@/domain/models/auth/Auth';

export type LoginGatewayInput = {
  email: string;
  password: string;
};

export interface ILoginGateway {
  login(input: LoginGatewayInput): Promise<LoginResult>;
}

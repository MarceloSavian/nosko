import type { LoginInput, LoginResult } from '@/domain/models/auth/Auth';

export interface ILogin {
  execute(input: LoginInput): Promise<LoginResult>;
}

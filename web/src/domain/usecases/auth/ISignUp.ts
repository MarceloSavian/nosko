import type { SignupInput, SignupResult } from '@/domain/models/auth/Auth';

export interface ISignUp {
  execute(input: SignupInput): Promise<SignupResult>;
}

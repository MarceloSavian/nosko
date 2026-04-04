import type { VerifyEmailInput } from '@/domain/models/auth/Auth';

export interface IVerifyEmail {
  execute(input: VerifyEmailInput): Promise<void>;
}

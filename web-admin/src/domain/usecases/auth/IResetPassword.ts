import type { ResetPasswordInput } from '@/domain/models/auth/Auth';

export interface IResetPassword {
  execute(input: ResetPasswordInput): Promise<void>;
}

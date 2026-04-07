import type { ResetPasswordInput } from '@/domain/models/password-reset/PasswordReset';

export interface IResetPassword {
  execute(input: ResetPasswordInput): Promise<void>;
}

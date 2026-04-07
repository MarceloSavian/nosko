import type { RequestPasswordResetInput } from '@/domain/models/password-reset/PasswordReset';

export interface IRequestPasswordReset {
  execute(input: RequestPasswordResetInput): Promise<void>;
}

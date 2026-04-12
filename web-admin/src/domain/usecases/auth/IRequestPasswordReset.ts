import type { RequestPasswordResetInput } from '@/domain/models/auth/Auth';

export interface IRequestPasswordReset {
  execute(input: RequestPasswordResetInput): Promise<void>;
}

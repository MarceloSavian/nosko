import type { ResendVerificationInput } from '@/domain/models/auth/Auth';

export interface IResendVerification {
  execute(input: ResendVerificationInput): Promise<void>;
}

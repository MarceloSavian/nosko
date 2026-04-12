import type {
  AdminLoginInput,
  AdminLoginResult,
  AdminRequestPasswordResetInput,
  AdminResetPasswordInput,
} from '../../models/admin/Admin.js';

export interface IAdminAuthService {
  login(input: AdminLoginInput): Promise<AdminLoginResult>;
  requestPasswordReset(input: AdminRequestPasswordResetInput): Promise<void>;
  resetPassword(input: AdminResetPasswordInput): Promise<void>;
}

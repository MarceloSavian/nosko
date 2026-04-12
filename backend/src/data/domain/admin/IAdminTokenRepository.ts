import type { AdminTokenType } from '../../../domain/models/admin/Admin.js';

export interface IAdminTokenRepository {
  insert(adminId: string, code: string, type: AdminTokenType, expiresAt: Date): Promise<void>;
  find(
    adminId: string,
    code: string,
    type: AdminTokenType,
  ): Promise<{ id: string; expiresAt: Date } | null>;
  deleteByAdminAndType(adminId: string, type: AdminTokenType): Promise<void>;
  delete(id: string): Promise<void>;
}

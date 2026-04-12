import type { AdminSchema } from '../../../domain/models/admin/Admin.js';

export interface IAdminRepository {
  findAll(): Promise<AdminSchema[]>;
  findById(id: string): Promise<AdminSchema | null>;
  findByEmail(email: string): Promise<AdminSchema | null>;
  findByEmailWithPassword(email: string): Promise<(AdminSchema & { passwordHash: string | null }) | null>;
  insert(data: { email: string; passwordHash: string; name: string }): Promise<AdminSchema>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  deleteById(id: string): Promise<void>;
}

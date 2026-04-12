import type { AdminSchema, CreateAdminInput } from '../../models/admin/Admin.js';

export interface IAdminManagementService {
  getAdmin(id: string): Promise<AdminSchema>;
  listAdmins(): Promise<AdminSchema[]>;
  createAdmin(input: CreateAdminInput): Promise<AdminSchema>;
  deleteAdmin(id: string): Promise<void>;
}

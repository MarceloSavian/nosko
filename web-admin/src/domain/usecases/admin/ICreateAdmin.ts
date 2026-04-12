import type { AdminSchema, CreateAdminInput } from '@/domain/models/admin/Admin';

export interface ICreateAdmin {
  execute(input: CreateAdminInput): Promise<AdminSchema>;
}

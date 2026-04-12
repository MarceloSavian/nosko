import type { AdminSchema, CreateAdminInput } from '@/domain/models/admin/Admin';

export interface IAdminGateway {
  list(): Promise<AdminSchema[]>;
  create(input: CreateAdminInput): Promise<AdminSchema>;
  delete(id: string): Promise<void>;
}

import type { AdminSchema } from '@/domain/models/admin/Admin';

export interface IListAdmins {
  execute(): Promise<AdminSchema[]>;
}

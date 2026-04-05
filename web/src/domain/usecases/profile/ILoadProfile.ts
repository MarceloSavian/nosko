import type { CustomerSchema } from '@/domain/models/profile/Profile';

export interface ILoadProfile {
  execute(): Promise<CustomerSchema>;
}

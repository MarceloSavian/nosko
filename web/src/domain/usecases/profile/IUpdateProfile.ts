import type { CustomerSchema, UpdateProfileInput } from '@/domain/models/profile/Profile';

export interface IUpdateProfile {
  execute(input: UpdateProfileInput): Promise<CustomerSchema>;
}

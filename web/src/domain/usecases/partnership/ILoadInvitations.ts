import type { PartnerInvitation } from '@/domain/models/partnership/Partnership';

export interface ILoadInvitations {
  execute(): Promise<PartnerInvitation[]>;
}

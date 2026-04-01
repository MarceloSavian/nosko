import type { PartnershipSchema } from '../../../domain/models/partnership/Partnership.js';

export interface IPartnershipRepository {
  insert(
    invitationId: string,
    customerAId: string,
    customerBId: string,
  ): Promise<PartnershipSchema>;
  findByCustomerId(customerId: string): Promise<PartnershipSchema | null>;
  findById(id: string): Promise<PartnershipSchema | null>;
  delete(id: string): Promise<void>;
}

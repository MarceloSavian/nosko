import type { PartnerInvitationSchema } from '../../../domain/models/partnership/Partnership.js';

export interface IPartnerInvitationRepository {
  insert(inviterId: string, inviteeEmail: string): Promise<PartnerInvitationSchema>;
  findById(id: string): Promise<PartnerInvitationSchema | null>;
  findByCustomerId(customerId: string): Promise<PartnerInvitationSchema[]>;
  updateStatus(id: string, status: string, acceptedAt?: Date): Promise<PartnerInvitationSchema>;
  delete(id: string): Promise<void>;
}

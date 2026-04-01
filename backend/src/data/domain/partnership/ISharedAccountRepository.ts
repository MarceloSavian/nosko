import type { SharedAccountSchema } from '../../../domain/models/partnership/Partnership.js';

export interface ISharedAccountRepository {
  findByPartnershipId(partnershipId: string): Promise<SharedAccountSchema[]>;
  replaceAll(
    partnershipId: string,
    sharedByCustomerId: string,
    bankAccountIds: string[],
  ): Promise<SharedAccountSchema[]>;
}

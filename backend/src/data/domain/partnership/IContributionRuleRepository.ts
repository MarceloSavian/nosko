import type { ContributionRuleSchema } from '../../../domain/models/partnership/Partnership.js';

export interface IContributionRuleRepository {
  findByPartnershipId(partnershipId: string): Promise<ContributionRuleSchema | null>;
  upsert(
    partnershipId: string,
    type: string,
    customerAPercentage?: number,
    customerBPercentage?: number,
  ): Promise<ContributionRuleSchema>;
}

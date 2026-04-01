import { mock } from 'node:test';
import type { IContributionRuleRepository } from '../../data/domain/partnership/IContributionRuleRepository.js';
import type { ContributionRuleSchema } from '../../domain/models/partnership/Partnership.js';

class MockContributionRuleRepository implements IContributionRuleRepository {
  findByPartnershipId = mock.fn(
    async (_partnershipId: string): Promise<ContributionRuleSchema | null> => null,
  );
  upsert = mock.fn(
    async (
      _partnershipId: string,
      _type: string,
      _customerAPercentage?: number,
      _customerBPercentage?: number,
    ): Promise<ContributionRuleSchema> => ({
      id: '',
      partnershipId: '',
      type: 'EQUAL',
      customerAPercentage: null,
      customerBPercentage: null,
      createdAt: '',
      updatedAt: '',
    }),
  );
}

export const mockContributionRuleRepository = new MockContributionRuleRepository();

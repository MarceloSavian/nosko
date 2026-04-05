import type { ContributionRule } from '@/domain/models/partnership/Partnership';

export interface ILoadContributionRules {
  execute(): Promise<ContributionRule>;
}

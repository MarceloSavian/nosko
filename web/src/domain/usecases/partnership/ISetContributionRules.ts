import type {
  ContributionRule,
  SetContributionRuleInput,
} from '@/domain/models/partnership/Partnership';

export interface ISetContributionRules {
  execute(input: SetContributionRuleInput): Promise<ContributionRule>;
}

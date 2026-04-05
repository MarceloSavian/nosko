import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import type {
  ContributionRule,
  SetContributionRuleInput,
} from '@/domain/models/partnership/Partnership';
import type { ISetContributionRules } from '@/domain/usecases/partnership/ISetContributionRules';

export class RemoteSetContributionRules implements ISetContributionRules {
  private readonly gateway: IPartnershipGateway;

  constructor(gateway: IPartnershipGateway) {
    this.gateway = gateway;
  }

  async execute(input: SetContributionRuleInput): Promise<ContributionRule> {
    try {
      return await this.gateway.setContributionRules(input);
    } catch (error) {
      rethrowKnown(error);
    }
  }
}

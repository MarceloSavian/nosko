import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import { UnexpectedError } from '@/domain/errors/auth';
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
    } catch {
      throw new UnexpectedError();
    }
  }
}

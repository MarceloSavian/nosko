import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import type { ContributionRule } from '@/domain/models/partnership/Partnership';
import type { ILoadContributionRules } from '@/domain/usecases/partnership/ILoadContributionRules';

export class RemoteLoadContributionRules implements ILoadContributionRules {
  private readonly gateway: IPartnershipGateway;

  constructor(gateway: IPartnershipGateway) {
    this.gateway = gateway;
  }

  async execute(): Promise<ContributionRule> {
    try {
      return await this.gateway.loadContributionRules();
    } catch (error) {
      rethrowKnown(error);
    }
  }
}

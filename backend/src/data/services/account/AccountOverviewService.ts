import type { IAccountOverviewService } from '../../../domain/usecases/account/IAccountOverviewService.js';
import type { IBankAccountOwnershipRepository } from '../../domain/account/IBankAccountOwnershipRepository.js';
import type { IBankAccountRepository } from '../../domain/account/IBankAccountRepository.js';

export class AccountOverviewService implements IAccountOverviewService {
  constructor(
    private readonly bankAccountRepository: IBankAccountRepository,
    private readonly ownershipRepository: IBankAccountOwnershipRepository,
  ) {}

  async getOverview(
    customerId: string,
  ): Promise<{ totalsByCurrency: { currencyCode: string; total: number }[] }> {
    const accountIds = await this.ownershipRepository.findAccountIdsByCustomerId(customerId);
    if (accountIds.length === 0) return { totalsByCurrency: [] };
    const totalsByCurrency = await this.bankAccountRepository.getOverviewByAccountIds(accountIds);
    return { totalsByCurrency };
  }
}

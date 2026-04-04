import type { AccountOverview } from '@/domain/models/account/Account';

export interface ILoadAccountOverview {
  execute(): Promise<AccountOverview>;
}

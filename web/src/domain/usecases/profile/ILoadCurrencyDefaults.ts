import type { CurrencyDefaultSchema } from '@/domain/models/profile/Profile';

export interface ILoadCurrencyDefaults {
  execute(): Promise<CurrencyDefaultSchema[]>;
}

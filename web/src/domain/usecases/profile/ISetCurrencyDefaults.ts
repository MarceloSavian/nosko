import type {
  CurrencyDefaultSchema,
  SetCurrencyDefaultsInput,
} from '@/domain/models/profile/Profile';

export interface ISetCurrencyDefaults {
  execute(input: SetCurrencyDefaultsInput): Promise<CurrencyDefaultSchema[]>;
}

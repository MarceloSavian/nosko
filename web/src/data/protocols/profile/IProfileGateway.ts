import type {
  CurrencyDefaultSchema,
  CustomerSchema,
  SetCurrencyDefaultsInput,
  UpdateProfileInput,
} from '@/domain/models/profile/Profile';

export interface IProfileGateway {
  loadProfile(): Promise<CustomerSchema>;
  updateProfile(input: UpdateProfileInput): Promise<CustomerSchema>;
  deleteAccount(): Promise<void>;
  loadCurrencyDefaults(): Promise<CurrencyDefaultSchema[]>;
  setCurrencyDefaults(input: SetCurrencyDefaultsInput): Promise<CurrencyDefaultSchema[]>;
}

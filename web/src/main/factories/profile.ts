import { RemoteDeleteAccount } from '@/data/usecases/profile/RemoteDeleteAccount';
import { RemoteLoadCurrencyDefaults } from '@/data/usecases/profile/RemoteLoadCurrencyDefaults';
import { RemoteLoadProfile } from '@/data/usecases/profile/RemoteLoadProfile';
import { RemoteSetCurrencyDefaults } from '@/data/usecases/profile/RemoteSetCurrencyDefaults';
import { RemoteUpdateProfile } from '@/data/usecases/profile/RemoteUpdateProfile';
import { HttpClient } from '@/infra/http/HttpClient';
import { ProfileGateway } from '@/infra/http/profile/ProfileGateway';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const TOKEN_KEY = 'nosko_access_token';

const httpClient = new HttpClient(API_BASE_URL);
const getToken = () => localStorage.getItem(TOKEN_KEY);
const profileGateway = new ProfileGateway(httpClient, getToken);

export const loadProfile = new RemoteLoadProfile(profileGateway);
export const updateProfile = new RemoteUpdateProfile(profileGateway);
export const deleteAccount = new RemoteDeleteAccount(profileGateway);
export const loadCurrencyDefaults = new RemoteLoadCurrencyDefaults(profileGateway);
export const setCurrencyDefaults = new RemoteSetCurrencyDefaults(profileGateway);

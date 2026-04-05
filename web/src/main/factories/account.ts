import { RemoteCreateAccount } from '@/data/usecases/account/RemoteCreateAccount';
import { RemoteDeleteAccount } from '@/data/usecases/account/RemoteDeleteAccount';
import { RemoteLoadAccountOverview } from '@/data/usecases/account/RemoteLoadAccountOverview';
import { RemoteLoadAccounts } from '@/data/usecases/account/RemoteLoadAccounts';
import { RemoteUpdateAccount } from '@/data/usecases/account/RemoteUpdateAccount';
import { RemoteLoadInstitutions } from '@/data/usecases/institution/RemoteLoadInstitutions';
import { AccountGateway } from '@/infra/http/account/AccountGateway';
import { HttpClient } from '@/infra/http/HttpClient';
import { InstitutionGateway } from '@/infra/http/institution/InstitutionGateway';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const httpClient = new HttpClient(API_BASE_URL);
const getToken = () => localStorage.getItem('nosko_access_token');

const accountGateway = new AccountGateway(httpClient, getToken);
export const loadAccounts = new RemoteLoadAccounts(accountGateway);
export const createAccount = new RemoteCreateAccount(accountGateway);
export const updateAccount = new RemoteUpdateAccount(accountGateway);
export const deleteAccount = new RemoteDeleteAccount(accountGateway);
export const loadAccountOverview = new RemoteLoadAccountOverview(accountGateway);

const institutionGateway = new InstitutionGateway(httpClient, getToken);
export const loadInstitutions = new RemoteLoadInstitutions(institutionGateway);

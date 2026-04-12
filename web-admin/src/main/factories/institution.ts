import { RemoteCreateInstitution } from '@/data/usecases/institution/RemoteCreateInstitution';
import { RemoteDeleteInstitution } from '@/data/usecases/institution/RemoteDeleteInstitution';
import { RemoteListInstitutions } from '@/data/usecases/institution/RemoteListInstitutions';
import { RemoteUpdateInstitution } from '@/data/usecases/institution/RemoteUpdateInstitution';
import { HttpClient } from '@/infra/http/HttpClient';
import { InstitutionGateway } from '@/infra/http/institution/InstitutionGateway';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const getToken = () => localStorage.getItem('nosko_admin_access_token');

const httpClient = new HttpClient(API_BASE_URL);
const institutionGateway = new InstitutionGateway(httpClient, getToken);

export const listInstitutions = new RemoteListInstitutions(institutionGateway);
export const createInstitution = new RemoteCreateInstitution(institutionGateway);
export const updateInstitution = new RemoteUpdateInstitution(institutionGateway);
export const deleteInstitution = new RemoteDeleteInstitution(institutionGateway);

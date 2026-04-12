import { RemoteCreateAdmin } from '@/data/usecases/admin/RemoteCreateAdmin';
import { RemoteDeleteAdmin } from '@/data/usecases/admin/RemoteDeleteAdmin';
import { RemoteListAdmins } from '@/data/usecases/admin/RemoteListAdmins';
import { AdminGateway } from '@/infra/http/admin/AdminGateway';
import { HttpClient } from '@/infra/http/HttpClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const getToken = () => localStorage.getItem('nosko_admin_access_token');

const httpClient = new HttpClient(API_BASE_URL);
const adminGateway = new AdminGateway(httpClient, getToken);

export const listAdmins = new RemoteListAdmins(adminGateway);
export const createAdmin = new RemoteCreateAdmin(adminGateway);
export const deleteAdmin = new RemoteDeleteAdmin(adminGateway);

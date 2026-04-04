import { RemoteLoadDashboard } from '@/data/usecases/dashboard/RemoteLoadDashboard';
import { DashboardGateway } from '@/infra/http/dashboard/DashboardGateway';
import { HttpClient } from '@/infra/http/HttpClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const TOKEN_KEY = 'nosko_access_token';

const httpClient = new HttpClient(API_BASE_URL);
const getToken = () => localStorage.getItem(TOKEN_KEY);
const dashboardGateway = new DashboardGateway(httpClient, getToken);

export const loadDashboard = new RemoteLoadDashboard(dashboardGateway);

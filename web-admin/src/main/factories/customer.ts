import { RemoteDeleteCustomer } from '@/data/usecases/customer/RemoteDeleteCustomer';
import { RemoteListCustomers } from '@/data/usecases/customer/RemoteListCustomers';
import { CustomerGateway } from '@/infra/http/customer/CustomerGateway';
import { HttpClient } from '@/infra/http/HttpClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const getToken = () => localStorage.getItem('nosko_admin_access_token');

const httpClient = new HttpClient(API_BASE_URL);
const customerGateway = new CustomerGateway(httpClient, getToken);

export const listCustomers = new RemoteListCustomers(customerGateway);
export const deleteCustomer = new RemoteDeleteCustomer(customerGateway);

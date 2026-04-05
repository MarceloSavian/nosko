import { RemoteCreateTransaction } from '@/data/usecases/transaction/RemoteCreateTransaction';
import { RemoteDeleteTransaction } from '@/data/usecases/transaction/RemoteDeleteTransaction';
import { RemoteLoadTransactions } from '@/data/usecases/transaction/RemoteLoadTransactions';
import { RemoteUpdateTransaction } from '@/data/usecases/transaction/RemoteUpdateTransaction';
import { HttpClient } from '@/infra/http/HttpClient';
import { TransactionGateway } from '@/infra/http/transaction/TransactionGateway';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const httpClient = new HttpClient(API_BASE_URL);
const getToken = () => localStorage.getItem('nosko_access_token');

const transactionGateway = new TransactionGateway(httpClient, getToken);

export const loadTransactions = new RemoteLoadTransactions(transactionGateway);
export const createTransaction = new RemoteCreateTransaction(transactionGateway);
export const updateTransaction = new RemoteUpdateTransaction(transactionGateway);
export const deleteTransaction = new RemoteDeleteTransaction(transactionGateway);

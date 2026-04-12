import { RemoteCreateCategory } from '@/data/usecases/budget/RemoteCreateCategory';
import { RemoteDeleteCategory } from '@/data/usecases/budget/RemoteDeleteCategory';
import { RemoteListCategories } from '@/data/usecases/budget/RemoteListCategories';
import { RemoteUpdateCategory } from '@/data/usecases/budget/RemoteUpdateCategory';
import { BudgetCategoryGateway } from '@/infra/http/budget/BudgetCategoryGateway';
import { HttpClient } from '@/infra/http/HttpClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const getToken = () => localStorage.getItem('nosko_admin_access_token');

const httpClient = new HttpClient(API_BASE_URL);
const budgetCategoryGateway = new BudgetCategoryGateway(httpClient, getToken);

export const listCategories = new RemoteListCategories(budgetCategoryGateway);
export const createCategory = new RemoteCreateCategory(budgetCategoryGateway);
export const updateCategory = new RemoteUpdateCategory(budgetCategoryGateway);
export const deleteCategory = new RemoteDeleteCategory(budgetCategoryGateway);

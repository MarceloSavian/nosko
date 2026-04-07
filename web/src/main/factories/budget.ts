import { RemoteAddBudgetItem } from '@/data/usecases/budget/RemoteAddBudgetItem';
import { RemoteCreateBudgetCategory } from '@/data/usecases/budget/RemoteCreateBudgetCategory';
import { RemoteCreateBudgetPlan } from '@/data/usecases/budget/RemoteCreateBudgetPlan';
import { RemoteCreateJointBudgetPlan } from '@/data/usecases/budget/RemoteCreateJointBudgetPlan';
import { RemoteDeleteBudgetCategory } from '@/data/usecases/budget/RemoteDeleteBudgetCategory';
import { RemoteDeleteBudgetItem } from '@/data/usecases/budget/RemoteDeleteBudgetItem';
import { RemoteDeleteBudgetPlan } from '@/data/usecases/budget/RemoteDeleteBudgetPlan';
import { RemoteDeleteJointBudgetPlan } from '@/data/usecases/budget/RemoteDeleteJointBudgetPlan';
import { RemoteLoadBudgetCategories } from '@/data/usecases/budget/RemoteLoadBudgetCategories';
import { RemoteLoadBudgetPlan } from '@/data/usecases/budget/RemoteLoadBudgetPlan';
import { RemoteLoadBudgetSummary } from '@/data/usecases/budget/RemoteLoadBudgetSummary';
import { RemoteLoadJointBudgetPlan } from '@/data/usecases/budget/RemoteLoadJointBudgetPlan';
import { RemoteUpdateBudgetCategory } from '@/data/usecases/budget/RemoteUpdateBudgetCategory';
import { RemoteUpdateBudgetItem } from '@/data/usecases/budget/RemoteUpdateBudgetItem';
import { BudgetGateway } from '@/infra/http/budget/BudgetGateway';
import { HttpClient } from '@/infra/http/HttpClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const httpClient = new HttpClient(API_BASE_URL);
const getToken = () => localStorage.getItem('nosko_access_token');

const budgetGateway = new BudgetGateway(httpClient, getToken);

export const loadBudgetCategories = new RemoteLoadBudgetCategories(budgetGateway);
export const createBudgetCategory = new RemoteCreateBudgetCategory(budgetGateway);
export const updateBudgetCategory = new RemoteUpdateBudgetCategory(budgetGateway);
export const deleteBudgetCategory = new RemoteDeleteBudgetCategory(budgetGateway);

export const loadBudgetPlan = new RemoteLoadBudgetPlan(budgetGateway);
export const createBudgetPlan = new RemoteCreateBudgetPlan(budgetGateway);
export const deleteBudgetPlan = new RemoteDeleteBudgetPlan(budgetGateway);

export const loadJointBudgetPlan = new RemoteLoadJointBudgetPlan(budgetGateway);
export const createJointBudgetPlan = new RemoteCreateJointBudgetPlan(budgetGateway);
export const deleteJointBudgetPlan = new RemoteDeleteJointBudgetPlan(budgetGateway);

export const addBudgetItem = new RemoteAddBudgetItem(budgetGateway);
export const updateBudgetItem = new RemoteUpdateBudgetItem(budgetGateway);
export const deleteBudgetItem = new RemoteDeleteBudgetItem(budgetGateway);

export const loadBudgetSummary = new RemoteLoadBudgetSummary(budgetGateway);

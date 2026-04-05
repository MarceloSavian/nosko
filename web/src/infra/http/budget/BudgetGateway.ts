import type { IBudgetGateway } from '@/data/protocols/budget/IBudgetGateway';
import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import { UnexpectedError } from '@/domain/errors/auth';
import type {
  BudgetCategory,
  CreateBudgetCategoryInput,
  UpdateBudgetCategoryInput,
} from '@/domain/models/budget/BudgetCategory';
import type {
  AddBudgetItemInput,
  BudgetItem,
  BudgetPlanWithItems,
  BudgetSummary,
  CreateBudgetPlanInput,
  UpdateBudgetItemInput,
} from '@/domain/models/budget/BudgetPlan';

export class BudgetGateway implements IBudgetGateway {
  private readonly httpClient: IHttpClient;
  private readonly getToken: () => string | null;

  constructor(httpClient: IHttpClient, getToken: () => string | null) {
    this.httpClient = httpClient;
    this.getToken = getToken;
  }

  private authHeaders(): Record<string, string> {
    const token = this.getToken();
    if (!token) throw new UnexpectedError();
    return { Authorization: `Bearer ${token}` };
  }

  async loadCategories(): Promise<BudgetCategory[]> {
    const response = await this.httpClient.request<BudgetCategory[]>({
      url: '/v1/budget-categories',
      method: 'get',
      headers: this.authHeaders(),
    });
    if (response.statusCode === 200) return response.body;
    throw new UnexpectedError();
  }

  async createCategory(input: CreateBudgetCategoryInput): Promise<BudgetCategory> {
    const response = await this.httpClient.request<BudgetCategory>({
      url: '/v1/budget-categories',
      method: 'post',
      body: input,
      headers: this.authHeaders(),
    });
    if (response.statusCode === 201) return response.body;
    throw new UnexpectedError();
  }

  async updateCategory(id: string, input: UpdateBudgetCategoryInput): Promise<BudgetCategory> {
    const response = await this.httpClient.request<BudgetCategory>({
      url: `/v1/budget-categories/${id}`,
      method: 'put',
      body: input,
      headers: this.authHeaders(),
    });
    if (response.statusCode === 200) return response.body;
    throw new UnexpectedError();
  }

  async deleteCategory(id: string): Promise<void> {
    const response = await this.httpClient.request({
      url: `/v1/budget-categories/${id}`,
      method: 'delete',
      headers: this.authHeaders(),
    });
    if (response.statusCode === 204) return;
    throw new UnexpectedError();
  }

  async loadPlan(yearMonth: string): Promise<BudgetPlanWithItems | null> {
    const response = await this.httpClient.request<BudgetPlanWithItems | null>({
      url: `/v1/budget-plans?yearMonth=${yearMonth}`,
      method: 'get',
      headers: this.authHeaders(),
    });
    if (response.statusCode === 200) return response.body;
    throw new UnexpectedError();
  }

  async createPlan(input: CreateBudgetPlanInput): Promise<BudgetPlanWithItems> {
    const response = await this.httpClient.request<BudgetPlanWithItems>({
      url: '/v1/budget-plans',
      method: 'post',
      body: input,
      headers: this.authHeaders(),
    });
    if (response.statusCode === 201) return response.body;
    throw new UnexpectedError();
  }

  async deletePlan(id: string): Promise<void> {
    const response = await this.httpClient.request({
      url: `/v1/budget-plans/${id}`,
      method: 'delete',
      headers: this.authHeaders(),
    });
    if (response.statusCode === 204) return;
    throw new UnexpectedError();
  }

  async loadJointPlan(yearMonth: string): Promise<BudgetPlanWithItems | null> {
    const response = await this.httpClient.request<BudgetPlanWithItems | null>({
      url: `/v1/partnership/budget-plans?yearMonth=${yearMonth}`,
      method: 'get',
      headers: this.authHeaders(),
    });
    if (response.statusCode === 200) return response.body;
    throw new UnexpectedError();
  }

  async createJointPlan(input: CreateBudgetPlanInput): Promise<BudgetPlanWithItems> {
    const response = await this.httpClient.request<BudgetPlanWithItems>({
      url: '/v1/partnership/budget-plans',
      method: 'post',
      body: input,
      headers: this.authHeaders(),
    });
    if (response.statusCode === 201) return response.body;
    throw new UnexpectedError();
  }

  async deleteJointPlan(id: string): Promise<void> {
    const response = await this.httpClient.request({
      url: `/v1/partnership/budget-plans/${id}`,
      method: 'delete',
      headers: this.authHeaders(),
    });
    if (response.statusCode === 204) return;
    throw new UnexpectedError();
  }

  async addItem(planId: string, input: AddBudgetItemInput): Promise<BudgetItem> {
    const response = await this.httpClient.request<BudgetItem>({
      url: `/v1/budget-plans/${planId}/items`,
      method: 'post',
      body: input,
      headers: this.authHeaders(),
    });
    if (response.statusCode === 201) return response.body;
    throw new UnexpectedError();
  }

  async updateItem(
    planId: string,
    itemId: string,
    input: UpdateBudgetItemInput,
  ): Promise<BudgetItem> {
    const response = await this.httpClient.request<BudgetItem>({
      url: `/v1/budget-plans/${planId}/items/${itemId}`,
      method: 'put',
      body: input,
      headers: this.authHeaders(),
    });
    if (response.statusCode === 200) return response.body;
    throw new UnexpectedError();
  }

  async deleteItem(planId: string, itemId: string): Promise<void> {
    const response = await this.httpClient.request({
      url: `/v1/budget-plans/${planId}/items/${itemId}`,
      method: 'delete',
      headers: this.authHeaders(),
    });
    if (response.statusCode === 204) return;
    throw new UnexpectedError();
  }

  async loadSummary(yearMonth: string): Promise<BudgetSummary> {
    const response = await this.httpClient.request<BudgetSummary>({
      url: `/v1/budget-plans/summary?yearMonth=${yearMonth}`,
      method: 'get',
      headers: this.authHeaders(),
    });
    if (response.statusCode === 200) return response.body;
    throw new UnexpectedError();
  }
}

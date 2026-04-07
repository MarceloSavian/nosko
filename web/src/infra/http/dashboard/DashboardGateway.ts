import type { IDashboardGateway } from '@/data/protocols/dashboard/IDashboardGateway';
import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import { UnexpectedError } from '@/domain/errors/auth';
import { type DashboardData, dashboardDataSchema } from '@/domain/models/dashboard/Dashboard';

export class DashboardGateway implements IDashboardGateway {
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

  async loadDashboard(yearMonth: string): Promise<DashboardData> {
    const response = await this.httpClient.request({
      url: `/v1/dashboard?yearMonth=${yearMonth}`,
      method: 'get',
      headers: this.authHeaders(),
    });
    if (response.statusCode === 200) {
      const parsed = dashboardDataSchema.safeParse(response.body);
      if (parsed.success) return parsed.data;
    }
    throw new UnexpectedError();
  }
}

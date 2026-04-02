export interface IAccountOverviewService {
  getOverview(
    customerId: string,
  ): Promise<{ totalsByCurrency: { currencyCode: string; total: number }[] }>;
}

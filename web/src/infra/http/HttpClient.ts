import type { HttpRequest, HttpResponse, IHttpClient } from '@/data/protocols/http/IHttpClient';

export class HttpClient implements IHttpClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<T>(data: HttpRequest): Promise<HttpResponse<T>> {
    const response = await fetch(`${this.baseUrl}${data.url}`, {
      method: data.method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...data.headers,
      },
      body: data.body ? JSON.stringify(data.body) : undefined,
    });

    const body = response.status === 204 ? (null as T) : ((await response.json()) as T);

    return {
      statusCode: response.status,
      body,
    };
  }
}

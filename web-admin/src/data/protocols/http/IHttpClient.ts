export type HttpRequest = {
  url: string;
  method: 'get' | 'post' | 'put' | 'delete';
  body?: unknown;
  headers?: Record<string, string>;
};

export type HttpResponse<T = unknown> = {
  statusCode: number;
  body: T;
};

export interface IHttpClient {
  request<T>(data: HttpRequest): Promise<HttpResponse<T>>;
}

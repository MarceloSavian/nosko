import type { RouteConfig } from '@asteasolutions/zod-to-openapi';
import type { ZodObject, ZodType } from 'zod/v4';
import { registerRoute } from './registry.js';

type HttpMethod = 'get' | 'post' | 'put' | 'delete';

export interface RouteMeta {
  method: HttpMethod;
  path: string;
  summary: string;
  tags: string[];
  auth: boolean;
  request?: {
    body?: ZodType;
    // biome-ignore lint/suspicious/noExplicitAny: RouteConfig requires ZodObject with any shape
    query?: ZodObject<any>;
    // biome-ignore lint/suspicious/noExplicitAny: RouteConfig requires ZodObject with any shape
    params?: ZodObject<any>;
  };
  responses: Record<number, { description: string; schema?: ZodType }>;
}

function toRouteConfig(meta: RouteMeta): RouteConfig {
  const responses: RouteConfig['responses'] = {};

  for (const [statusCode, response] of Object.entries(meta.responses)) {
    responses[statusCode] = {
      description: response.description,
      ...(response.schema && {
        content: {
          'application/json': { schema: response.schema },
        },
      }),
    };
  }

  if (meta.auth) {
    responses[401] = { description: 'Missing or invalid authentication token' };
  }

  const config: RouteConfig = {
    method: meta.method,
    path: meta.path,
    summary: meta.summary,
    tags: meta.tags,
    responses,
    ...(meta.auth && {
      security: [{ bearerAuth: [] }],
    }),
  };

  if (meta.request?.body) {
    config.request = {
      ...config.request,
      body: {
        content: {
          'application/json': { schema: meta.request.body },
        },
      },
    };
  }

  if (meta.request?.query) {
    config.request = {
      ...config.request,
      query: meta.request.query,
    };
  }

  if (meta.request?.params) {
    config.request = {
      ...config.request,
      params: meta.request.params,
    };
  }

  return config;
}

export function registerRouteMetas(metas: RouteMeta[]) {
  for (const meta of metas) {
    registerRoute(toRouteConfig(meta));
  }
}

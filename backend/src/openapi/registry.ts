import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  type RouteConfig,
} from '@asteasolutions/zod-to-openapi';

const registry = new OpenAPIRegistry();

export function registerRoute(config: RouteConfig) {
  registry.registerPath(config);
}

export function generateDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Suomi API',
      version: '1.0.0',
      description: 'Financial management API for couples',
    },
    servers: [{ url: '/v1', description: 'API v1' }],
    security: [{ bearerAuth: [] }],
  });
}

export { registry };

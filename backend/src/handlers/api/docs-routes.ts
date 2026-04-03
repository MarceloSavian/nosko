import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import type { ProxyRoute } from '../domain/proxy.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

function serveOpenApiJson(spec: object): () => Promise<APIGatewayProxyResult> {
  return async () => ({
    statusCode: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(spec),
  });
}

function serveSwaggerUi(): () => Promise<APIGatewayProxyResult> {
  return async () => ({
    statusCode: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'text/html' },
    body: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Suomi API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/v1/docs/openapi.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
    });
  </script>
</body>
</html>`,
  });
}

export function makeDocsHandler(spec: object) {
  const routes: ProxyRoute = {
    'GET /v1/docs': serveSwaggerUi(),
    'GET /v1/docs/openapi.json': serveOpenApiJson(spec),
  };
  return (event: APIGatewayProxyEventV2) => {
    const route = routes[event.routeKey];
    return route
      ? route(event)
      : Promise.resolve({ statusCode: 404, body: `Request path ${event.routeKey} not found` });
  };
}

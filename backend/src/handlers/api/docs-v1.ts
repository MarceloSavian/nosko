import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeDocsHandler } from './docs-routes.js';

const spec = JSON.parse(readFileSync(join(import.meta.dirname, 'openapi.json'), 'utf-8'));

export const handler = makeDocsHandler(spec);

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataType, newDb } from 'pg-mem';
import type { Pool } from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createTestDb(): Pool {
  const db = newDb();

  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.uuid,
    impure: true,
    implementation: () => crypto.randomUUID(),
  });

  const migrationPath = join(__dirname, '../../../migrations/001_create_customers.sql');
  const migrationSql = readFileSync(migrationPath, 'utf-8');
  db.public.none(migrationSql);

  const { Pool: MockPool } = db.adapters.createPg();
  return new MockPool() as unknown as Pool;
}

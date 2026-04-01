import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';
import { DataType, newDb } from 'pg-mem';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createTestDb(): { pool: Pool; restore: () => void } {
  const db = newDb();

  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.uuid,
    impure: true,
    implementation: () => crypto.randomUUID(),
  });

  db.public.registerFunction({
    name: 'to_char',
    args: [DataType.date, DataType.text],
    returns: DataType.text,
    implementation: (date: Date, fmt: string) => {
      if (fmt === 'YYYY-MM') {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
      }
      return date.toISOString();
    },
  });

  const migrationPath = join(__dirname, '../../../migrations/001_create_customers.sql');
  const migrationSql = readFileSync(migrationPath, 'utf-8');
  db.public.none(migrationSql);

  const backup = db.backup();
  const { Pool: MockPool } = db.adapters.createPg();
  const pool = new MockPool() as unknown as Pool;

  return { pool, restore: () => backup.restore() };
}

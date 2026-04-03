import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export const handler = async () => {
  const migrationsDir = join(import.meta.dirname, 'migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  await pool.query(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			filename TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`);

  const { rows: applied } = await pool.query('SELECT filename FROM schema_migrations');
  const appliedSet = new Set(applied.map((r) => r.filename));

  const pending = files.filter((f) => !appliedSet.has(f));

  if (pending.length === 0) {
    console.log('No pending migrations.');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'No pending migrations', applied: files.length }),
    };
  }

  for (const file of pending) {
    const sql = readFileSync(join(migrationsDir, file), 'utf-8');
    console.log(`Applying migration: ${file}`);
    await pool.query(sql);
    await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    console.log(`Applied: ${file}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: `Applied ${pending.length} migration(s)`, files: pending }),
  };
};

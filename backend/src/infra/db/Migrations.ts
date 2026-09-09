import * as path from "node:path"
import { PgMigrator } from "@effect/sql-pg"

const migrationsDirectory = path.join(import.meta.dirname, "..", "..", "..", "migrations")

export const MigrationsLive = PgMigrator.layer({
  loader: PgMigrator.fromFileSystem(migrationsDirectory),
})

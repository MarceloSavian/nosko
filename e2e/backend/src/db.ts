import { Client } from "pg"
import { config } from "./config.ts"

export type AdminDb = Client

export const connectAdminDb = async (): Promise<AdminDb> => {
  const client = new Client({ connectionString: config.databaseUrl })
  await client.connect()
  return client
}

export const closeAdminDb = async (db: AdminDb): Promise<void> => {
  await db.end()
}

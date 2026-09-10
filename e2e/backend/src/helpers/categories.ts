import type { AdminDb } from "../db.ts"

// There is no categories RPC group yet (packages/contracts has no categories.ts), so cycles,
// bills, rules and payments flows seed categories directly. Deleting the household cascades
// these rows, so cleanup.ts does not need to track them separately.

export const seedHouseholdCategory = async (
  db: AdminDb,
  householdId: string,
  name: string,
): Promise<string> => {
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO categories (household_id, scope, owner_user_id, name)
     VALUES ($1, 'household', NULL, $2)
     RETURNING id`,
    [householdId, name],
  )
  const row = rows[0]
  if (row === undefined) {
    throw new Error(`Failed to seed household category "${name}"`)
  }
  return row.id
}

export const seedPersonalCategory = async (
  db: AdminDb,
  householdId: string,
  ownerUserId: string,
  name: string,
): Promise<string> => {
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO categories (household_id, scope, owner_user_id, name)
     VALUES ($1, 'personal', $2, $3)
     RETURNING id`,
    [householdId, ownerUserId, name],
  )
  const row = rows[0]
  if (row === undefined) {
    throw new Error(`Failed to seed personal category "${name}"`)
  }
  return row.id
}

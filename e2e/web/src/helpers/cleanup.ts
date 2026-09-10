import type { AdminDb } from "../db.ts"

// Deletes only what a test run created. households(id) ON DELETE CASCADE and users(id) ON
// DELETE CASCADE cover everything else — same helper as e2e/backend, see its README.
export const cleanupTestData = async (
  db: AdminDb,
  input: { readonly householdIds?: readonly string[]; readonly userIds: readonly string[] },
): Promise<void> => {
  for (const householdId of input.householdIds ?? []) {
    await db.query("DELETE FROM households WHERE id = $1", [householdId])
  }
  for (const userId of input.userIds) {
    await db.query("DELETE FROM users WHERE id = $1", [userId])
  }
}

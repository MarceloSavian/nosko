import type { AdminDb } from "../db.ts"

// Deletes only what a test run created. households(id) ON DELETE CASCADE covers accounts,
// categories, cycles, fixed_bills, recurring_rules, category_caps, shared_payments,
// member_transfers, cycle_incomes, household_members, household_invitations and
// household_settings; users(id) ON DELETE CASCADE covers auth_tokens and user_sessions.
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

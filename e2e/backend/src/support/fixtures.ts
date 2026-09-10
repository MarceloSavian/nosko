import { rpc, withSession } from "../client/apiClient.ts"
import { login, Session } from "../client/httpApi.ts"
import type { AdminDb } from "../db.ts"
import { findAuthTokenCode, findInvitationCode } from "../helpers/codes.ts"
import { TEST_PASSWORD, uniqueEmail, uniqueName } from "../helpers/testData.ts"

export interface TestUser {
  readonly id: string
  readonly email: string
  readonly session: Session
}

export const signUpVerifyAndLogIn = async (db: AdminDb, label: string): Promise<TestUser> => {
  const email = uniqueEmail(label)
  const user = await rpc((client) =>
    client.auth.signUp({
      name: uniqueName(label),
      email,
      password: TEST_PASSWORD,
      preferredLocale: "en",
    }),
  )

  const code = await findAuthTokenCode(db, user.id, "email_verify")
  await rpc((client) => client.auth.verifyEmail({ userId: user.id, code }))

  const session = new Session()
  const result = await login(session, { email, password: TEST_PASSWORD })
  if (result.status !== "authenticated") {
    throw new Error(`Expected fresh signup to log in without MFA, got status "${result.status}"`)
  }

  return { id: user.id, email, session }
}

export interface Couple {
  readonly owner: TestUser
  readonly partner: TestUser
  readonly householdId: string
  readonly cleanupUserIds: readonly [string, string]
}

// Realistic baseline for most flow files: two verified, logged-in members sharing a household.
// Each flow file owns its own AdminDb connection and calls this in a `before` hook; cleanup.ts's
// household delete (called from that file's `after`) cascades everything this creates.
export const setupCouple = async (db: AdminDb): Promise<Couple> => {
  const owner = await signUpVerifyAndLogIn(db, "owner")
  const partner = await signUpVerifyAndLogIn(db, "partner")

  const household = await rpc((client) =>
    client.household.create(
      { name: "E2E Household", baseCurrency: "EUR" },
      withSession(owner.session),
    ),
  )

  await rpc((client) =>
    client.household.invite({ email: partner.email }, withSession(owner.session)),
  )
  const invitationCode = await findInvitationCode(db, partner.email)
  await rpc((client) =>
    client.household.acceptInvitation(
      { householdId: household.id, code: invitationCode },
      withSession(partner.session),
    ),
  )

  return {
    owner,
    partner,
    householdId: household.id,
    cleanupUserIds: [owner.id, partner.id],
  }
}

import { createHash } from "node:crypto"
import type { AdminDb } from "../db.ts"

// Mirrors backend/src/infra/auth/OpaqueTokens.ts's hashToken exactly: unsalted sha256 of a
// 6-digit numeric code. Every code-based flow (email verify, mfa otp, password reset,
// household invitations) uses this, so the full 1,000,000-candidate space can be brute-forced
// locally in well under a second — no debug endpoint needed on the deployed backend.
const hashCode = (candidate: string) => createHash("sha256").update(candidate).digest("hex")

const CODE_DIGITS = 6
const CODE_SPACE = 10 ** CODE_DIGITS

const bruteForceCode = (targetHash: string): string => {
  for (let i = 0; i < CODE_SPACE; i++) {
    const candidate = i.toString().padStart(CODE_DIGITS, "0")
    if (hashCode(candidate) === targetHash) {
      return candidate
    }
  }
  throw new Error(`Could not recover a 6-digit code for hash ${targetHash}`)
}

export type AuthTokenType = "email_verify" | "password_reset" | "mfa_otp"

export const findAuthTokenCode = async (
  db: AdminDb,
  userId: string,
  type: AuthTokenType,
): Promise<string> => {
  const { rows } = await db.query<{ token_hash: string }>(
    `SELECT token_hash FROM auth_tokens
     WHERE user_id = $1 AND type = $2 AND consumed_at IS NULL AND expires_at > now()
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, type],
  )
  const row = rows[0]
  if (row === undefined) {
    throw new Error(`No pending ${type} token found for user ${userId}`)
  }
  return bruteForceCode(row.token_hash)
}

export const findInvitationCode = async (db: AdminDb, email: string): Promise<string> => {
  const { rows } = await db.query<{ token_hash: string }>(
    `SELECT token_hash FROM household_invitations
     WHERE email = $1 AND status = 'pending' AND expires_at > now()
     ORDER BY created_at DESC
     LIMIT 1`,
    [email],
  )
  const row = rows[0]
  if (row === undefined) {
    throw new Error(`No pending invitation found for ${email}`)
  }
  return bruteForceCode(row.token_hash)
}

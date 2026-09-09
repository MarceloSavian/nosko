import { describe, expect, it } from "@jest/globals"
import { Effect, Option } from "effect"
import { HouseholdInvitationsRepository } from "../../data/protocols/HouseholdInvitationsRepository"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { HouseholdInvitationsRepositoryLive } from "./HouseholdInvitationsRepositoryLive"

const now = new Date("2026-01-01T00:00:00.000Z")
const later = new Date("2026-01-08T00:00:00.000Z")

const invitationRow = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  household_id: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
  email: "gabriele@example.com",
  token_hash: "sha256-hash",
  invited_by: "8c9e6679-7425-40de-944b-e07fc1f90ae9",
  status: "pending",
  expires_at: later,
  accepted_by: null,
  created_at: now,
}

describe("HouseholdInvitationsRepositoryLive", () => {
  it("creates an invitation", async () => {
    const { layer, queries } = makeTestSqlClient(() => [invitationRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* HouseholdInvitationsRepository
        return yield* repo.create({
          householdId: invitationRow.household_id,
          email: invitationRow.email,
          tokenHash: "sha256-hash",
          invitedBy: invitationRow.invited_by,
          expiresAt: later,
        })
      }).pipe(Effect.provide(HouseholdInvitationsRepositoryLive), Effect.provide(layer)),
    )

    expect(decoded.status).toBe("pending")
    expect(queries[0]?.sql).toBe(
      'INSERT INTO "household_invitations" ("household_id","email","token_hash","invited_by","expires_at") VALUES ($1,$2,$3,$4,$5) RETURNING *',
    )
  })

  it("finds a pending, unexpired invitation by token hash", async () => {
    const { layer, queries } = makeTestSqlClient(() => [invitationRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* HouseholdInvitationsRepository
        return yield* repo.findPendingByTokenHash(invitationRow.household_id, "sha256-hash")
      }).pipe(Effect.provide(HouseholdInvitationsRepositoryLive), Effect.provide(layer)),
    )

    expect(Option.isSome(decoded)).toBe(true)
    expect(queries[0]?.sql).toContain("status = 'pending'")
    expect(queries[0]?.sql).toContain('"expires_at" > now()')
  })

  it("returns none when no pending invitation matches", async () => {
    const { layer } = makeTestSqlClient(() => [])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* HouseholdInvitationsRepository
        return yield* repo.findPendingByTokenHash(invitationRow.household_id, "wrong")
      }).pipe(Effect.provide(HouseholdInvitationsRepositoryLive), Effect.provide(layer)),
    )

    expect(Option.isNone(decoded)).toBe(true)
  })

  it("lists invitations for a household, newest first", async () => {
    const { layer, queries } = makeTestSqlClient(() => [invitationRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* HouseholdInvitationsRepository
        return yield* repo.listByHousehold(invitationRow.household_id)
      }).pipe(Effect.provide(HouseholdInvitationsRepositoryLive), Effect.provide(layer)),
    )

    expect(decoded).toHaveLength(1)
    expect(queries[0]?.sql).toBe(
      'SELECT * FROM "household_invitations" WHERE "household_id" = $1 ORDER BY "created_at" DESC',
    )
  })

  it("revokes an invitation", async () => {
    const { layer, queries } = makeTestSqlClient(() => [])

    await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* HouseholdInvitationsRepository
        return yield* repo.revoke(invitationRow.id)
      }).pipe(Effect.provide(HouseholdInvitationsRepositoryLive), Effect.provide(layer)),
    )

    expect(queries[0]?.sql).toBe('UPDATE "household_invitations" SET "status" = $1 WHERE id = $2')
    expect(queries[0]?.params?.[0]).toBe("revoked")
  })

  it("marks an invitation accepted", async () => {
    const { layer, queries } = makeTestSqlClient(() => [])
    const acceptedBy = "8c9e6679-7425-40de-944b-e07fc1f90aea"

    await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* HouseholdInvitationsRepository
        return yield* repo.markAccepted(invitationRow.id, acceptedBy)
      }).pipe(Effect.provide(HouseholdInvitationsRepositoryLive), Effect.provide(layer)),
    )

    expect(queries[0]?.sql).toBe(
      'UPDATE "household_invitations" SET "status" = $1, "accepted_by" = $2 WHERE id = $3',
    )
    expect(queries[0]?.params).toEqual(["accepted", acceptedBy, invitationRow.id])
  })
})

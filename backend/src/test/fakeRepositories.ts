import { randomUUID } from "node:crypto"
import { DateTime, Effect, Layer, Option } from "effect"
import { AuthTokensRepository } from "../data/protocols/AuthTokensRepository"
import { HouseholdInvitationsRepository } from "../data/protocols/HouseholdInvitationsRepository"
import { HouseholdsRepository } from "../data/protocols/HouseholdsRepository"
import { UserSessionsRepository } from "../data/protocols/UserSessionsRepository"
import { UsersRepository } from "../data/protocols/UsersRepository"
import type { AuthToken } from "../domain/models/AuthToken"
import type { Household, HouseholdMember } from "../domain/models/Household"
import type { HouseholdInvitation } from "../domain/models/HouseholdInvitation"
import type { User, UserCredentials } from "../domain/models/User"
import type { UserSession } from "../domain/models/UserSession"

const now = () => DateTime.unsafeFromDate(new Date())
const asUtc = (date: Date) => DateTime.unsafeFromDate(date)
const isFuture = (dateTime: DateTime.Utc) => DateTime.toEpochMillis(dateTime) > Date.now()

export const makeFakeUsersRepository = (seed: ReadonlyArray<UserCredentials> = []) => {
  const users = new Map<string, UserCredentials>(seed.map((u) => [u.id, u]))

  const toUser = (u: UserCredentials): User => ({
    id: u.id,
    email: u.email,
    name: "Test User",
    preferredLocale: "pt-BR",
    emailVerified: u.emailVerified,
    mfaEnabled: u.mfaEnabled,
    createdAt: now(),
    updatedAt: now(),
  })

  const layer = Layer.succeed(UsersRepository, {
    create: (input) => {
      const id = randomUUID()
      const record: UserCredentials = {
        id,
        email: input.email,
        passwordHash: input.passwordHash,
        emailVerified: false,
        mfaEnabled: false,
        mfaSecret: null,
      }
      users.set(id, record)
      return Effect.succeed(toUser(record))
    },
    findById: (id) => Effect.succeed(Option.fromNullable(users.get(id)).pipe(Option.map(toUser))),
    findCredentialsByEmail: (email) =>
      Effect.succeed(Option.fromNullable([...users.values()].find((u) => u.email === email))),
    findCredentialsById: (id) => Effect.succeed(Option.fromNullable(users.get(id))),
    setEmailVerified: (id) =>
      Effect.sync(() => {
        const u = users.get(id)
        if (u) users.set(id, { ...u, emailVerified: true })
      }),
    setPasswordHash: (id, passwordHash) =>
      Effect.sync(() => {
        const u = users.get(id)
        if (u) users.set(id, { ...u, passwordHash })
      }),
    setMfa: (id, input) =>
      Effect.sync(() => {
        const u = users.get(id)
        if (u) users.set(id, { ...u, mfaSecret: input.secret, mfaEnabled: input.enabled })
      }),
  })

  return { layer, users }
}

export const makeFakeAuthTokensRepository = () => {
  const tokens = new Map<string, AuthToken & { readonly tokenHash: string }>()

  const layer = Layer.succeed(AuthTokensRepository, {
    create: (input) => {
      const id = randomUUID()
      const record = {
        id,
        userId: input.userId,
        type: input.type,
        tokenHash: input.tokenHash,
        expiresAt: asUtc(input.expiresAt),
        consumedAt: null,
        createdAt: now(),
      }
      tokens.set(id, record)
      return Effect.succeed(record)
    },
    findValid: (userId, type, tokenHash) =>
      Effect.succeed(
        Option.fromNullable(
          [...tokens.values()].find(
            (t) =>
              t.userId === userId &&
              t.type === type &&
              t.tokenHash === tokenHash &&
              t.consumedAt === null &&
              isFuture(t.expiresAt),
          ),
        ),
      ),
    consume: (id) =>
      Effect.sync(() => {
        const t = tokens.get(id)
        if (t) tokens.set(id, { ...t, consumedAt: now() })
      }),
  })

  return { layer, tokens }
}

export const makeFakeUserSessionsRepository = () => {
  const sessions = new Map<string, UserSession & { readonly refreshTokenHash: string }>()

  const layer = Layer.succeed(UserSessionsRepository, {
    create: (input) => {
      const id = randomUUID()
      const record = {
        id,
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        deviceLabel: input.deviceLabel,
        mfaTrustedUntil: input.mfaTrustedUntil ? asUtc(input.mfaTrustedUntil) : null,
        expiresAt: asUtc(input.expiresAt),
        revokedAt: null,
        createdAt: now(),
      }
      sessions.set(id, record)
      return Effect.succeed(record)
    },
    findById: (id) => Effect.succeed(Option.fromNullable(sessions.get(id))),
    findByRefreshTokenHash: (userId, refreshTokenHash) =>
      Effect.succeed(
        Option.fromNullable(
          [...sessions.values()].find(
            (s) =>
              s.userId === userId &&
              s.refreshTokenHash === refreshTokenHash &&
              s.revokedAt === null &&
              isFuture(s.expiresAt),
          ),
        ),
      ),
    listByUser: (userId) =>
      Effect.succeed([...sessions.values()].filter((s) => s.userId === userId)),
    revoke: (id) =>
      Effect.sync(() => {
        const s = sessions.get(id)
        if (s) sessions.set(id, { ...s, revokedAt: now() })
      }),
    revokeAllForUser: (userId) =>
      Effect.sync(() => {
        for (const [id, s] of sessions) {
          if (s.userId === userId && s.revokedAt === null) {
            sessions.set(id, { ...s, revokedAt: now() })
          }
        }
      }),
  })

  return { layer, sessions }
}

export const makeFakeHouseholdsRepository = (
  seed: { households?: ReadonlyArray<Household>; members?: ReadonlyArray<HouseholdMember> } = {},
) => {
  const households = new Map<string, Household>((seed.households ?? []).map((h) => [h.id, h]))
  const members: Array<HouseholdMember> = [...(seed.members ?? [])]

  const layer = Layer.succeed(HouseholdsRepository, {
    create: (input) => {
      const id = randomUUID()
      const record: Household = {
        id,
        name: input.name,
        baseCurrency: input.baseCurrency,
        createdBy: input.createdBy,
        createdAt: now(),
        updatedAt: now(),
      }
      households.set(id, record)
      return Effect.succeed(record)
    },
    findById: (id) => Effect.succeed(Option.fromNullable(households.get(id))),
    addMember: (input) => {
      const existing = members.filter((m) => m.householdId === input.householdId)
      if (existing.length >= 2) {
        return Effect.die(new Error("household already has the maximum of two members"))
      }
      const record: HouseholdMember = {
        householdId: input.householdId,
        userId: input.userId,
        role: input.role,
        displayName: input.displayName,
        joinedAt: now(),
      }
      members.push(record)
      return Effect.succeed(record)
    },
  })

  return { layer, households, members }
}

export const makeFakeHouseholdInvitationsRepository = () => {
  const invitations = new Map<string, HouseholdInvitation & { readonly tokenHash: string }>()

  const layer = Layer.succeed(HouseholdInvitationsRepository, {
    create: (input) => {
      const id = randomUUID()
      const record = {
        id,
        householdId: input.householdId,
        email: input.email,
        tokenHash: input.tokenHash,
        invitedBy: input.invitedBy,
        status: "pending" as const,
        expiresAt: asUtc(input.expiresAt),
        acceptedBy: null,
        createdAt: now(),
      }
      invitations.set(id, record)
      return Effect.succeed(record)
    },
    findPendingByTokenHash: (householdId, tokenHash) =>
      Effect.succeed(
        Option.fromNullable(
          [...invitations.values()].find(
            (i) =>
              i.householdId === householdId &&
              i.tokenHash === tokenHash &&
              i.status === "pending" &&
              isFuture(i.expiresAt),
          ),
        ),
      ),
    listByHousehold: (householdId) =>
      Effect.succeed([...invitations.values()].filter((i) => i.householdId === householdId)),
    revoke: (id) =>
      Effect.sync(() => {
        const i = invitations.get(id)
        if (i) invitations.set(id, { ...i, status: "revoked" })
      }),
    markAccepted: (id, acceptedBy) =>
      Effect.sync(() => {
        const i = invitations.get(id)
        if (i) invitations.set(id, { ...i, status: "accepted", acceptedBy })
      }),
  })

  return { layer, invitations }
}

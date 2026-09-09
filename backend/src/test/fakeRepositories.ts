import { randomUUID } from "node:crypto"
import { Effect, Layer, Option } from "effect"
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

export const makeFakeUsersRepository = (seed: ReadonlyArray<UserCredentials> = []) => {
  const users = new Map<string, UserCredentials>(seed.map((u) => [u.id, u]))

  const toUser = (u: UserCredentials): User => ({
    id: u.id,
    email: u.email,
    name: "Test User",
    preferredLocale: "pt-BR",
    emailVerified: u.emailVerified,
    mfaEnabled: u.mfaEnabled,
    createdAt: new Date() as never,
    updatedAt: new Date() as never,
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
        expiresAt: input.expiresAt as never,
        consumedAt: null,
        createdAt: new Date() as never,
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
              (t.expiresAt as unknown as Date).getTime() > Date.now(),
          ),
        ),
      ),
    consume: (id) =>
      Effect.sync(() => {
        const t = tokens.get(id)
        if (t) tokens.set(id, { ...t, consumedAt: new Date() as never })
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
        mfaTrustedUntil: input.mfaTrustedUntil as never,
        expiresAt: input.expiresAt as never,
        revokedAt: null,
        createdAt: new Date() as never,
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
              (s.expiresAt as unknown as Date).getTime() > Date.now(),
          ),
        ),
      ),
    listByUser: (userId) =>
      Effect.succeed([...sessions.values()].filter((s) => s.userId === userId)),
    revoke: (id) =>
      Effect.sync(() => {
        const s = sessions.get(id)
        if (s) sessions.set(id, { ...s, revokedAt: new Date() as never })
      }),
    revokeAllForUser: (userId) =>
      Effect.sync(() => {
        for (const [id, s] of sessions) {
          if (s.userId === userId && s.revokedAt === null) {
            sessions.set(id, { ...s, revokedAt: new Date() as never })
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
        createdAt: new Date() as never,
        updatedAt: new Date() as never,
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
        joinedAt: new Date() as never,
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
        expiresAt: input.expiresAt as never,
        acceptedBy: null,
        createdAt: new Date() as never,
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
              (i.expiresAt as unknown as Date).getTime() > Date.now(),
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

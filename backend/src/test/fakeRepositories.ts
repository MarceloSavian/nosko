import { randomUUID } from "node:crypto"
import { DateTime, Effect, Layer, Option } from "effect"
import { AccountsRepository } from "../data/protocols/AccountsRepository"
import { AuthTokensRepository } from "../data/protocols/AuthTokensRepository"
import { FxRatesRepository } from "../data/protocols/FxRatesRepository"
import { HouseholdInvitationsRepository } from "../data/protocols/HouseholdInvitationsRepository"
import { HouseholdsRepository } from "../data/protocols/HouseholdsRepository"
import { UserSessionsRepository } from "../data/protocols/UserSessionsRepository"
import { UsersRepository } from "../data/protocols/UsersRepository"
import type { Account } from "../domain/models/Account"
import type { AuthToken } from "../domain/models/AuthToken"
import type { FxRate } from "../domain/models/FxRate"
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
    preferredLocale: u.preferredLocale,
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
        preferredLocale: input.preferredLocale,
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
    update: (id, input) => {
      const existing = households.get(id)
      if (!existing) return Effect.die(new Error(`household ${id} not found`))
      const updated = { ...existing, name: input.name, baseCurrency: input.baseCurrency }
      households.set(id, updated)
      return Effect.succeed(updated)
    },
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
    listMembers: (householdId) =>
      Effect.succeed(members.filter((m) => m.householdId === householdId)),
    removeMember: (householdId, userId) =>
      Effect.sync(() => {
        const index = members.findIndex((m) => m.householdId === householdId && m.userId === userId)
        if (index >= 0) members.splice(index, 1)
      }),
    findMembershipByUserId: (userId) =>
      Effect.succeed(Option.fromNullable(members.find((m) => m.userId === userId))),
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

export const makeFakeFxRatesRepository = (seed: ReadonlyArray<FxRate> = []) => {
  const rates: Array<FxRate> = [...seed]

  const layer = Layer.succeed(FxRatesRepository, {
    upsert: (input) => {
      const existingIndex = rates.findIndex(
        (r) =>
          r.base === input.base &&
          r.quote === input.quote &&
          DateTime.toEpochMillis(r.rateDate) === input.rateDate.getTime(),
      )
      const record: FxRate = {
        id: existingIndex >= 0 ? (rates[existingIndex] as FxRate).id : randomUUID(),
        rateDate: asUtc(input.rateDate),
        base: input.base,
        quote: input.quote,
        rate: input.rate,
        createdAt: now(),
      }
      if (existingIndex >= 0) {
        rates[existingIndex] = record
      } else {
        rates.push(record)
      }
      return Effect.succeed(record)
    },
    findOnOrBefore: (base, quote, date) =>
      Effect.succeed(
        Option.fromNullable(
          rates
            .filter(
              (r) =>
                r.base === base &&
                r.quote === quote &&
                DateTime.toEpochMillis(r.rateDate) <= date.getTime(),
            )
            .sort(
              (a, b) => DateTime.toEpochMillis(b.rateDate) - DateTime.toEpochMillis(a.rateDate),
            )[0],
        ),
      ),
  })

  return { layer, rates }
}

export const makeFakeAccountsRepository = (seed: ReadonlyArray<Account> = []) => {
  const accounts = new Map<string, Account>(seed.map((a) => [a.id, a]))

  const layer = Layer.succeed(AccountsRepository, {
    create: (input) => {
      const id = randomUUID()
      const record: Account = {
        id,
        householdId: input.householdId,
        ownerUserId: input.ownerUserId,
        coOwnerUserId: null,
        ownership: input.ownership,
        visibility: input.visibility,
        institution: input.institution,
        nickname: input.nickname,
        type: input.type,
        currency: input.currency,
        maskedId: input.maskedId,
        balanceMinor: input.balanceMinor,
        purpose: input.purpose,
        statementCloseDay: input.statementCloseDay,
        creditLimitMinor: input.creditLimitMinor,
        autopayAccountId: input.autopayAccountId,
        source: "manual",
        lastImportAt: null,
        createdAt: now(),
        updatedAt: now(),
      }
      accounts.set(id, record)
      return Effect.succeed(record)
    },
    findById: (id) => Effect.succeed(Option.fromNullable(accounts.get(id))),
    list: () => Effect.succeed([...accounts.values()]),
    update: (id, input) => {
      const existing = accounts.get(id)
      if (!existing) return Effect.die(new Error(`account ${id} not found`))
      const updated: Account = {
        ...existing,
        nickname: input.nickname,
        maskedId: input.maskedId,
        balanceMinor: input.balanceMinor,
        purpose: input.purpose,
        statementCloseDay: input.statementCloseDay,
        creditLimitMinor: input.creditLimitMinor,
        autopayAccountId: input.autopayAccountId,
        updatedAt: now(),
      }
      accounts.set(id, updated)
      return Effect.succeed(updated)
    },
    setVisibility: (id, visibility) => {
      const existing = accounts.get(id)
      if (!existing) return Effect.die(new Error(`account ${id} not found`))
      const updated = { ...existing, visibility, updatedAt: now() }
      accounts.set(id, updated)
      return Effect.succeed(updated)
    },
    setCoOwner: (id, coOwnerUserId) => {
      const existing = accounts.get(id)
      if (!existing) return Effect.die(new Error(`account ${id} not found`))
      const updated = { ...existing, coOwnerUserId, updatedAt: now() }
      accounts.set(id, updated)
      return Effect.succeed(updated)
    },
    remove: (id) =>
      Effect.sync(() => {
        accounts.delete(id)
      }),
  })

  return { layer, accounts }
}

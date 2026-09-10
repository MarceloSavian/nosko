import { randomUUID } from "node:crypto"
import { DateTime, Effect, Layer, Option } from "effect"
import { AccountsRepository } from "../data/protocols/AccountsRepository"
import { AuthTokensRepository } from "../data/protocols/AuthTokensRepository"
import { CategoryCapsRepository } from "../data/protocols/CategoryCapsRepository"
import { CyclesRepository } from "../data/protocols/CyclesRepository"
import { FixedBillsRepository } from "../data/protocols/FixedBillsRepository"
import { FxRatesRepository } from "../data/protocols/FxRatesRepository"
import { HouseholdInvitationsRepository } from "../data/protocols/HouseholdInvitationsRepository"
import { HouseholdsRepository } from "../data/protocols/HouseholdsRepository"
import { RecurringRulesRepository } from "../data/protocols/RecurringRulesRepository"
import { SharedPaymentsRepository } from "../data/protocols/SharedPaymentsRepository"
import { UserSessionsRepository } from "../data/protocols/UserSessionsRepository"
import { UsersRepository } from "../data/protocols/UsersRepository"
import type { Account } from "../domain/models/Account"
import type { AuthToken } from "../domain/models/AuthToken"
import type { CategoryCap } from "../domain/models/CategoryCap"
import type { Cycle, CycleIncome, MemberTransfer } from "../domain/models/Cycle"
import type { FixedBill } from "../domain/models/FixedBill"
import type { FxRate } from "../domain/models/FxRate"
import type { Household, HouseholdMember, HouseholdSettings } from "../domain/models/Household"
import type { HouseholdInvitation } from "../domain/models/HouseholdInvitation"
import type { RecurringRule } from "../domain/models/RecurringRule"
import type { SharedPayment } from "../domain/models/SharedPayment"
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

const defaultSettingsFor = (household: Household): HouseholdSettings => ({
  householdId: household.id,
  cycleAnchorDay: 23,
  locale: "pt-BR",
  baseCurrency: household.baseCurrency,
  defaultReserveMinor: 0,
  box3AllowanceMinor: 5_700_000,
  box3Rate: 0.0216,
  inflationRate: 0,
  updatedAt: now(),
})

export const makeFakeHouseholdsRepository = (
  seed: {
    households?: ReadonlyArray<Household>
    members?: ReadonlyArray<HouseholdMember>
    settings?: ReadonlyArray<HouseholdSettings>
  } = {},
) => {
  const households = new Map<string, Household>((seed.households ?? []).map((h) => [h.id, h]))
  const members: Array<HouseholdMember> = [...(seed.members ?? [])]
  const settings = new Map<string, HouseholdSettings>(
    (seed.settings ?? []).map((s) => [s.householdId, s]),
  )
  for (const household of households.values()) {
    if (!settings.has(household.id)) {
      settings.set(household.id, defaultSettingsFor(household))
    }
  }

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
      settings.set(id, defaultSettingsFor(record))
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
    findSettings: (householdId) => Effect.succeed(Option.fromNullable(settings.get(householdId))),
  })

  return { layer, households, members, settings }
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

export const makeFakeCyclesRepository = (seed: ReadonlyArray<Cycle> = []) => {
  const cycles = new Map<string, Cycle>(seed.map((c) => [c.id, c]))
  const incomes = new Map<string, CycleIncome>()
  const transfers = new Map<string, MemberTransfer>()

  const layer = Layer.succeed(CyclesRepository, {
    create: (input) => {
      const id = randomUUID()
      const record: Cycle = {
        id,
        householdId: input.householdId,
        cycleKey: input.cycleKey,
        title: input.title,
        startDate: asUtc(input.startDate),
        endDate: asUtc(input.endDate),
        status: "open",
        closedAt: null,
        reserveMinor: input.reserveMinor,
        estimateMinor: input.estimateMinor,
        seedOpeningBalanceMinor: input.seedOpeningBalanceMinor,
        surplusGoalId: null,
        surplusDestinationLabel: null,
        createdAt: now(),
        updatedAt: now(),
      }
      cycles.set(id, record)
      return Effect.succeed(record)
    },
    findById: (id) => Effect.succeed(Option.fromNullable(cycles.get(id))),
    findByCycleKey: (householdId, cycleKey) =>
      Effect.succeed(
        Option.fromNullable(
          [...cycles.values()].find(
            (c) => c.householdId === householdId && c.cycleKey === cycleKey,
          ),
        ),
      ),
    list: () =>
      Effect.succeed(
        [...cycles.values()].sort(
          (a, b) => DateTime.toEpochMillis(a.startDate) - DateTime.toEpochMillis(b.startDate),
        ),
      ),
    findCurrent: (today) =>
      Effect.succeed(
        Option.fromNullable(
          [...cycles.values()].find(
            (c) =>
              DateTime.toEpochMillis(c.startDate) <= today.getTime() &&
              DateTime.toEpochMillis(c.endDate) >= today.getTime(),
          ),
        ),
      ),
    update: (id, input) => {
      const existing = cycles.get(id)
      if (!existing) return Effect.die(new Error(`cycle ${id} not found`))
      const updated: Cycle = {
        ...existing,
        title: input.title,
        reserveMinor: input.reserveMinor,
        estimateMinor: input.estimateMinor,
        surplusGoalId: input.surplusGoalId,
        surplusDestinationLabel: input.surplusDestinationLabel,
        updatedAt: now(),
      }
      cycles.set(id, updated)
      return Effect.succeed(updated)
    },
    close: (id) => {
      const existing = cycles.get(id)
      if (!existing) return Effect.die(new Error(`cycle ${id} not found`))
      const updated: Cycle = { ...existing, status: "closed", closedAt: now(), updatedAt: now() }
      cycles.set(id, updated)
      return Effect.succeed(updated)
    },
    listIncomes: (cycleId) =>
      Effect.succeed([...incomes.values()].filter((i) => i.cycleId === cycleId)),
    setIncome: (input) => {
      const existingEntry = [...incomes.entries()].find(
        ([, i]) =>
          i.cycleId === input.cycleId &&
          i.memberUserId === input.memberUserId &&
          i.kind === input.kind,
      )
      const id = existingEntry ? existingEntry[0] : randomUUID()
      const record: CycleIncome = {
        id,
        cycleId: input.cycleId,
        memberUserId: input.memberUserId,
        kind: input.kind,
        amountMinor: input.amountMinor,
        currency: input.currency,
        createdAt: existingEntry ? existingEntry[1].createdAt : now(),
        updatedAt: now(),
      }
      incomes.set(id, record)
      return Effect.succeed(record)
    },
    listTransfers: (cycleId) =>
      Effect.succeed([...transfers.values()].filter((t) => t.cycleId === cycleId)),
    findTransferById: (id) => Effect.succeed(Option.fromNullable(transfers.get(id))),
    recordTransfer: (input) => {
      const id = randomUUID()
      const record: MemberTransfer = {
        id,
        cycleId: input.cycleId,
        memberUserId: input.memberUserId,
        direction: input.direction,
        amountMinor: input.amountMinor,
        currency: input.currency,
        settledAt: null,
        method: input.method,
        createdAt: now(),
      }
      transfers.set(id, record)
      return Effect.succeed(record)
    },
    settleTransfer: (id) => {
      const existing = transfers.get(id)
      if (!existing) return Effect.die(new Error(`transfer ${id} not found`))
      const updated = { ...existing, settledAt: now() }
      transfers.set(id, updated)
      return Effect.succeed(updated)
    },
  })

  return { layer, cycles, incomes, transfers }
}

export const makeFakeFixedBillsRepository = (seed: ReadonlyArray<FixedBill> = []) => {
  const bills = new Map<string, FixedBill>(seed.map((b) => [b.id, b]))

  const layer = Layer.succeed(FixedBillsRepository, {
    create: (input) => {
      const id = randomUUID()
      const record: FixedBill = {
        id,
        cycleId: input.cycleId,
        recurringRuleId: input.recurringRuleId,
        label: input.label,
        amountMinor: input.amountMinor,
        currency: input.currency,
        paid: false,
        paidOnDay: null,
        payingAccountId: input.payingAccountId,
        dueDay: input.dueDay,
        autoPaid: false,
        categoryId: input.categoryId,
        sortOrder: input.sortOrder,
        createdAt: now(),
        updatedAt: now(),
      }
      bills.set(id, record)
      return Effect.succeed(record)
    },
    findById: (id) => Effect.succeed(Option.fromNullable(bills.get(id))),
    listByCycle: (cycleId) =>
      Effect.succeed(
        [...bills.values()]
          .filter((b) => b.cycleId === cycleId)
          .sort((a, b) => a.sortOrder - b.sortOrder),
      ),
    update: (id, input) => {
      const existing = bills.get(id)
      if (!existing) return Effect.die(new Error(`fixed bill ${id} not found`))
      const updated: FixedBill = {
        ...existing,
        label: input.label,
        amountMinor: input.amountMinor,
        payingAccountId: input.payingAccountId,
        dueDay: input.dueDay,
        categoryId: input.categoryId,
        sortOrder: input.sortOrder,
        updatedAt: now(),
      }
      bills.set(id, updated)
      return Effect.succeed(updated)
    },
    setPaid: (id, paid, paidOnDay) => {
      const existing = bills.get(id)
      if (!existing) return Effect.die(new Error(`fixed bill ${id} not found`))
      const updated = { ...existing, paid, paidOnDay, updatedAt: now() }
      bills.set(id, updated)
      return Effect.succeed(updated)
    },
    remove: (id) =>
      Effect.sync(() => {
        bills.delete(id)
      }),
  })

  return { layer, bills }
}

export const makeFakeRecurringRulesRepository = (seed: ReadonlyArray<RecurringRule> = []) => {
  const rules = new Map<string, RecurringRule>(seed.map((r) => [r.id, r]))

  const layer = Layer.succeed(RecurringRulesRepository, {
    create: (input) => {
      const id = randomUUID()
      const record: RecurringRule = {
        id,
        householdId: input.householdId,
        matchType: input.matchType,
        matcher: input.matcher,
        expectedAmountMinor: input.expectedAmountMinor,
        currency: input.currency,
        categoryId: input.categoryId,
        cadence: input.cadence,
        isFixedBill: input.isFixedBill,
        active: true,
        source: "user_defined",
        confidence: null,
        createdAt: now(),
        updatedAt: now(),
      }
      rules.set(id, record)
      return Effect.succeed(record)
    },
    findById: (id) => Effect.succeed(Option.fromNullable(rules.get(id))),
    list: () => Effect.succeed([...rules.values()]),
    listActiveFixedBillRules: () =>
      Effect.succeed([...rules.values()].filter((r) => r.active && r.isFixedBill)),
    update: (id, input) => {
      const existing = rules.get(id)
      if (!existing) return Effect.die(new Error(`rule ${id} not found`))
      const updated: RecurringRule = {
        ...existing,
        matcher: input.matcher,
        expectedAmountMinor: input.expectedAmountMinor,
        currency: input.currency,
        categoryId: input.categoryId,
        cadence: input.cadence,
        isFixedBill: input.isFixedBill,
        updatedAt: now(),
      }
      rules.set(id, updated)
      return Effect.succeed(updated)
    },
    deactivate: (id) => {
      const existing = rules.get(id)
      if (!existing) return Effect.die(new Error(`rule ${id} not found`))
      const updated = { ...existing, active: false, updatedAt: now() }
      rules.set(id, updated)
      return Effect.succeed(updated)
    },
  })

  return { layer, rules }
}

export const makeFakeSharedPaymentsRepository = (seed: ReadonlyArray<SharedPayment> = []) => {
  const payments = new Map<string, SharedPayment>(seed.map((p) => [p.id, p]))

  const layer = Layer.succeed(SharedPaymentsRepository, {
    create: (input) => {
      const id = randomUUID()
      const record: SharedPayment = {
        id,
        householdId: input.householdId,
        cycleId: input.cycleId,
        accountId: input.accountId,
        bookedAt: asUtc(input.bookedAt),
        description: input.description,
        counterparty: input.counterparty,
        amountMinor: input.amountMinor,
        currency: input.currency,
        amountBaseMinor: input.amountBaseMinor,
        fxRate: input.fxRate,
        categoryId: input.categoryId,
        createdBy: input.createdBy,
        createdAt: now(),
        updatedAt: now(),
      }
      payments.set(id, record)
      return Effect.succeed(record)
    },
    findById: (id) => Effect.succeed(Option.fromNullable(payments.get(id))),
    listByCycle: (cycleId) =>
      Effect.succeed(
        [...payments.values()]
          .filter((p) => p.cycleId === cycleId)
          .sort((a, b) => DateTime.toEpochMillis(a.bookedAt) - DateTime.toEpochMillis(b.bookedAt)),
      ),
    update: (id, input) => {
      const existing = payments.get(id)
      if (!existing) return Effect.die(new Error(`shared payment ${id} not found`))
      const updated: SharedPayment = {
        ...existing,
        description: input.description,
        counterparty: input.counterparty,
        amountMinor: input.amountMinor,
        amountBaseMinor: input.amountBaseMinor,
        fxRate: input.fxRate,
        categoryId: input.categoryId,
        updatedAt: now(),
      }
      payments.set(id, updated)
      return Effect.succeed(updated)
    },
    remove: (id) =>
      Effect.sync(() => {
        payments.delete(id)
      }),
  })

  return { layer, payments }
}

export const makeFakeCategoryCapsRepository = (seed: ReadonlyArray<CategoryCap> = []) => {
  const caps = new Map<string, CategoryCap>(seed.map((c) => [c.id, c]))

  const layer = Layer.succeed(CategoryCapsRepository, {
    listByCycle: (cycleId) =>
      Effect.succeed([...caps.values()].filter((c) => c.cycleId === cycleId)),
    replaceForCycle: (householdId, cycleId, input) => {
      for (const [id, c] of caps) {
        if (c.cycleId === cycleId) caps.delete(id)
      }
      const created = input.map((cap) => {
        const id = randomUUID()
        const record: CategoryCap = {
          id,
          householdId,
          cycleId,
          categoryId: cap.categoryId,
          capMinor: cap.capMinor,
        }
        caps.set(id, record)
        return record
      })
      return Effect.succeed(created)
    },
  })

  return { layer, caps }
}

import * as RpcTest from "@effect/rpc/RpcTest"
import { describe, expect, it } from "@jest/globals"
import { HouseholdRpcs } from "@nosko/contracts"
import { ConfigProvider, DateTime, Effect, Exit, Layer, type Scope } from "effect"
import { AccessTokens, AccessTokensLive } from "../../infra/auth/AccessTokens"
import { OpaqueTokensLive } from "../../infra/auth/OpaqueTokens"
import { ACCESS_TOKEN_COOKIE } from "../../infra/auth/SessionCookies"
import { makeFakeMailer } from "../../test/fakeMailer"
import {
  makeFakeCategoriesRepository,
  makeFakeHouseholdInvitationsRepository,
  makeFakeHouseholdsRepository,
  makeFakeUsersRepository,
} from "../../test/fakeRepositories"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { AuthMiddlewareLive } from "./AuthMiddlewareLive"
import { HouseholdGroupLive } from "./HouseholdGroupLive"

const withConfig = ConfigProvider.fromMap(
  new Map([["JWT_SECRET", "a-very-long-random-jwt-signing-secret-value-1234567890"]]),
)

const marcelo = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  email: "marcelo@example.com",
  passwordHash: "argon2id$fake",
  preferredLocale: "pt-BR" as const,
  emailVerified: true,
  mfaEnabled: false,
  mfaSecret: null,
}

const gabriele = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
  email: "gabriele@example.com",
  passwordHash: "argon2id$fake",
  preferredLocale: "pt-BR" as const,
  emailVerified: true,
  mfaEnabled: false,
  mfaSecret: null,
}

const buildTestLayer = () => {
  const { layer: sqlLayer } = makeTestSqlClient(() => [])
  const usersRepo = makeFakeUsersRepository([marcelo, gabriele])
  const householdsRepo = makeFakeHouseholdsRepository()
  const invitationsRepo = makeFakeHouseholdInvitationsRepository()
  const categoriesRepo = makeFakeCategoriesRepository()
  const mailer = makeFakeMailer()

  const infraLayer = Layer.mergeAll(
    sqlLayer,
    usersRepo.layer,
    householdsRepo.layer,
    invitationsRepo.layer,
    categoriesRepo.layer,
    mailer.layer,
    OpaqueTokensLive,
    AccessTokensLive,
  )

  const testLayer = Layer.mergeAll(HouseholdGroupLive, AuthMiddlewareLive).pipe(
    Layer.provide(infraLayer),
  )

  return {
    testLayer,
    households: householdsRepo.households,
    members: householdsRepo.members,
    categories: categoriesRepo.categories,
    sent: mailer.sent,
  }
}

const signAccessToken = (userId: string) =>
  Effect.gen(function* () {
    const accessTokens = yield* AccessTokens
    return yield* accessTokens.sign({ userId, sessionId: "session-1" })
  }).pipe(
    Effect.provide(AccessTokensLive),
    Effect.withConfigProvider(withConfig),
    Effect.runPromise,
  )

const headersFor = (token: string) => ({ headers: { cookie: `${ACCESS_TOKEN_COOKIE}=${token}` } })

const run = <A, E, R>(
  testLayer: Layer.Layer<R, unknown, never>,
  effect: Effect.Effect<A, E, R | Scope.Scope>,
) =>
  Effect.runPromiseExit(
    Effect.scoped(effect).pipe(Effect.provide(testLayer), Effect.withConfigProvider(withConfig)),
  )

describe("HouseholdGroupLive", () => {
  it("household.create creates a household owned by the caller", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marcelo.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        return yield* client(
          "household.create",
          { name: "Casa", baseCurrency: "EUR" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.name).toBe("Casa")
    }
  })

  it("household.create seeds the default household categories from FR-PAY-4", async () => {
    const { testLayer, categories } = buildTestLayer()
    const token = await signAccessToken(marcelo.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        return yield* client(
          "household.create",
          { name: "Casa", baseCurrency: "EUR" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      const seeded = [...categories.values()].filter((c) => c.householdId === exit.value.id)
      expect(seeded.map((c) => c.name)).toEqual([
        "Mercado & Feira",
        "Moradia & Fixas",
        "Lazer & Restaurantes",
        "Transporte",
        "Saúde & Pets",
        "Subscrições",
        "Outros",
      ])
      expect(seeded.every((c) => c.scope === "household")).toBe(true)
    }
  })

  it("household.get returns null before the caller has a household", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marcelo.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        return yield* client("household.get", undefined, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toBeNull()
    }
  })

  it("household.get returns the household once the caller is a member", async () => {
    const { testLayer, members } = buildTestLayer()
    const token = await signAccessToken(marcelo.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        const created = yield* client(
          "household.create",
          { name: "Casa", baseCurrency: "EUR" },
          headersFor(token),
        )
        members.push({
          householdId: created.id,
          userId: marcelo.id,
          role: "owner",
          displayName: null,
          joinedAt: DateTime.unsafeFromDate(new Date()),
        })
        return yield* client("household.get", undefined, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value?.name).toBe("Casa")
    }
  })

  it("household.get returns null when the member's household row is missing", async () => {
    const { testLayer, members } = buildTestLayer()
    const token = await signAccessToken(marcelo.id)
    members.push({
      householdId: "00000000-0000-0000-0000-000000000000",
      userId: marcelo.id,
      role: "owner",
      displayName: null,
      joinedAt: DateTime.unsafeFromDate(new Date()),
    })

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        return yield* client("household.get", undefined, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toBeNull()
    }
  })

  it("dies if the inviter's own user row is gone by the time the handler runs", async () => {
    const { testLayer, members } = buildTestLayer()
    const ghostId = "44444444-4444-4444-4444-444444444444"
    const token = await signAccessToken(ghostId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        const created = yield* client(
          "household.create",
          { name: "Casa", baseCurrency: "EUR" },
          headersFor(token),
        )
        members.push({
          householdId: created.id,
          userId: ghostId,
          role: "owner",
          displayName: null,
          joinedAt: DateTime.unsafeFromDate(new Date()),
        })
        return yield* client("household.invite", { email: gabriele.email }, headersFor(token))
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit)) {
      expect(exit.cause._tag).toBe("Die")
    }
  })

  it("household.update fails with NoHousehold before the caller has one", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marcelo.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        return yield* client(
          "household.update",
          { name: "Casa Nova", baseCurrency: "BRL" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("household.update updates the caller's household", async () => {
    const { testLayer, members } = buildTestLayer()
    const token = await signAccessToken(marcelo.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        const created = yield* client(
          "household.create",
          { name: "Casa", baseCurrency: "EUR" },
          headersFor(token),
        )
        members.push({
          householdId: created.id,
          userId: marcelo.id,
          role: "owner",
          displayName: null,
          joinedAt: DateTime.unsafeFromDate(new Date()),
        })
        return yield* client(
          "household.update",
          { name: "Casa Nova", baseCurrency: "BRL" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.name).toBe("Casa Nova")
    }
  })

  it("household.invite fails with NotHouseholdOwner before the caller has a household", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marcelo.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        return yield* client("household.invite", { email: gabriele.email }, headersFor(token))
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  const createHouseholdAsOwner = <E, R>(
    client: (
      tag: "household.create",
      payload: { name: string; baseCurrency: string },
      options: { headers: { cookie: string } },
    ) => Effect.Effect<{ id: string; name: string; baseCurrency: string }, E, R>,
    token: string,
    members: Array<{
      householdId: string
      userId: string
      role: "owner" | "member"
      displayName: string | null
      joinedAt: DateTime.Utc
    }>,
  ) =>
    Effect.gen(function* () {
      const created = yield* client(
        "household.create",
        { name: "Casa", baseCurrency: "EUR" },
        headersFor(token),
      )
      members.push({
        householdId: created.id,
        userId: marcelo.id,
        role: "owner",
        displayName: null,
        joinedAt: DateTime.unsafeFromDate(new Date()),
      })
      return created
    })

  it("household.invite fails with NotHouseholdOwner for a non-owner member", async () => {
    const { testLayer, members } = buildTestLayer()
    const ownerToken = await signAccessToken(marcelo.id)
    const memberToken = await signAccessToken(gabriele.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        const household = yield* createHouseholdAsOwner(client, ownerToken, members)
        members.push({
          householdId: household.id,
          userId: gabriele.id,
          role: "member",
          displayName: null,
          joinedAt: DateTime.unsafeFromDate(new Date()),
        })
        return yield* client(
          "household.invite",
          { email: "third@example.com" },
          headersFor(memberToken),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("household.invite sends an invitation email and returns it", async () => {
    const { testLayer, members, sent } = buildTestLayer()
    const token = await signAccessToken(marcelo.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        yield* createHouseholdAsOwner(client, token, members)
        return yield* client("household.invite", { email: gabriele.email }, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.email).toBe(gabriele.email)
    }
    expect(sent).toHaveLength(1)
  })

  it("household.invite fails with HouseholdFull once the household already has two members", async () => {
    const { testLayer, members } = buildTestLayer()
    const token = await signAccessToken(marcelo.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        const household = yield* createHouseholdAsOwner(client, token, members)
        members.push({
          householdId: household.id,
          userId: gabriele.id,
          role: "member",
          displayName: null,
          joinedAt: DateTime.unsafeFromDate(new Date()),
        })
        return yield* client("household.invite", { email: "third@example.com" }, headersFor(token))
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("household.listInvitations fails with NoHousehold before the caller has one", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marcelo.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        return yield* client("household.listInvitations", undefined, headersFor(token))
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("household.listInvitations lists pending invitations", async () => {
    const { testLayer, members } = buildTestLayer()
    const token = await signAccessToken(marcelo.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        yield* createHouseholdAsOwner(client, token, members)
        yield* client("household.invite", { email: gabriele.email }, headersFor(token))
        return yield* client("household.listInvitations", undefined, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toHaveLength(1)
    }
  })

  it("household.revokeInvitation fails with NotHouseholdOwner before the caller has a household", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marcelo.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        return yield* client(
          "household.revokeInvitation",
          { invitationId: "00000000-0000-0000-0000-000000000000" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("household.revokeInvitation revokes a pending invitation", async () => {
    const { testLayer, members } = buildTestLayer()
    const token = await signAccessToken(marcelo.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        yield* createHouseholdAsOwner(client, token, members)
        const invitation = yield* client(
          "household.invite",
          { email: gabriele.email },
          headersFor(token),
        )
        yield* client(
          "household.revokeInvitation",
          { invitationId: invitation.id },
          headersFor(token),
        )
        return yield* client("household.listInvitations", undefined, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value[0]?.status).toBe("revoked")
    }
  })

  it("household.acceptInvitation lets the invited user join the household", async () => {
    const { testLayer, members, sent } = buildTestLayer()
    const ownerToken = await signAccessToken(marcelo.id)
    const inviteeToken = await signAccessToken(gabriele.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        const household = yield* createHouseholdAsOwner(client, ownerToken, members)
        yield* client("household.invite", { email: gabriele.email }, headersFor(ownerToken))
        const code = sent[0]?.text.match(/\d{6}/)?.[0] as string
        return yield* client(
          "household.acceptInvitation",
          { householdId: household.id, code },
          headersFor(inviteeToken),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.userId).toBe(gabriele.id)
      expect(exit.value.role).toBe("member")
    }
  })

  it("household.acceptInvitation fails with InvitationInvalid for a wrong code", async () => {
    const { testLayer, members } = buildTestLayer()
    const ownerToken = await signAccessToken(marcelo.id)
    const inviteeToken = await signAccessToken(gabriele.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        const household = yield* createHouseholdAsOwner(client, ownerToken, members)
        yield* client("household.invite", { email: gabriele.email }, headersFor(ownerToken))
        return yield* client(
          "household.acceptInvitation",
          { householdId: household.id, code: "wrong0" },
          headersFor(inviteeToken),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("household.listMembers fails with NoHousehold before the caller has one", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marcelo.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        return yield* client("household.listMembers", undefined, headersFor(token))
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("household.listMembers lists the household's members", async () => {
    const { testLayer, members } = buildTestLayer()
    const token = await signAccessToken(marcelo.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        yield* createHouseholdAsOwner(client, token, members)
        return yield* client("household.listMembers", undefined, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toHaveLength(1)
      // household_members.display_name is always null today — the view falls back to the
      // member's actual account name instead of exposing their raw user id.
      expect(exit.value[0]?.displayName).toBe("Test User")
    }
  })

  it("household.listMembers dies if a member's own user row is gone", async () => {
    const { testLayer, members } = buildTestLayer()
    const ghostId = "55555555-5555-5555-5555-555555555555"
    const token = await signAccessToken(marcelo.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        const household = yield* createHouseholdAsOwner(client, token, members)
        members.push({
          householdId: household.id,
          userId: ghostId,
          role: "member",
          displayName: null,
          joinedAt: DateTime.unsafeFromDate(new Date()),
        })
        return yield* client("household.listMembers", undefined, headersFor(token))
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit)) {
      expect(exit.cause._tag).toBe("Die")
    }
  })

  it("household.removeMember fails with NotHouseholdOwner before the caller has a household", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marcelo.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        return yield* client("household.removeMember", { userId: gabriele.id }, headersFor(token))
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("household.removeMember removes a member from the household", async () => {
    const { testLayer, members } = buildTestLayer()
    const token = await signAccessToken(marcelo.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(HouseholdRpcs, { flatten: true })
        const household = yield* createHouseholdAsOwner(client, token, members)
        members.push({
          householdId: household.id,
          userId: gabriele.id,
          role: "member",
          displayName: null,
          joinedAt: DateTime.unsafeFromDate(new Date()),
        })
        yield* client("household.removeMember", { userId: gabriele.id }, headersFor(token))
        return yield* client("household.listMembers", undefined, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toHaveLength(1)
    }
  })
})

import { CurrentUser, HouseholdRpcs } from "@nosko/contracts"
import { type DateTime, Effect, Option } from "effect"
import { CategoriesRepository } from "../../data/protocols/CategoriesRepository"
import { HouseholdInvitationsRepository } from "../../data/protocols/HouseholdInvitationsRepository"
import { HouseholdsRepository } from "../../data/protocols/HouseholdsRepository"
import { UsersRepository } from "../../data/protocols/UsersRepository"
import {
  acceptInvitation,
  inviteMember,
  revokeInvitation,
} from "../../data/usecases/HouseholdInvitations"
import { NoHousehold, NotHouseholdOwner } from "../../domain/errors/HouseholdErrors"
import { dieOnSqlError } from "./dieOnSqlError"

const dieIfMissing = <A>(found: Option.Option<A>) =>
  Option.match(found, {
    onNone: () => Effect.die(new Error("expected row vanished mid-request")),
    onSome: Effect.succeed,
  })

// FR-PAY-4's default household categories, seeded once so payments/fixed bills have something to
// categorise against from the start — full category management (rename/add/remove) is U15 scope.
const DEFAULT_HOUSEHOLD_CATEGORIES = [
  "Mercado & Feira",
  "Moradia & Fixas",
  "Lazer & Restaurantes",
  "Transporte",
  "Saúde & Pets",
  "Subscrições",
  "Outros",
]

const toHouseholdView = (household: { id: string; name: string; baseCurrency: string }) => ({
  id: household.id,
  name: household.name,
  baseCurrency: household.baseCurrency,
})

const toMemberView = (member: {
  userId: string
  role: "owner" | "member"
  displayName: string | null
}) => ({ userId: member.userId, role: member.role, displayName: member.displayName })

const toInvitationView = (invitation: {
  id: string
  email: string
  status: "pending" | "accepted" | "revoked" | "expired"
  expiresAt: DateTime.Utc
}) => ({
  id: invitation.id,
  email: invitation.email,
  status: invitation.status,
  expiresAt: invitation.expiresAt,
})

export const HouseholdGroupLive = HouseholdRpcs.toLayer(
  Effect.gen(function* () {
    const households = yield* HouseholdsRepository
    const invitations = yield* HouseholdInvitationsRepository
    const users = yield* UsersRepository
    const categories = yield* CategoriesRepository

    const requireHousehold = (householdId: string | null) =>
      householdId === null
        ? Effect.fail(new NoHousehold({}))
        : households.findById(householdId).pipe(dieOnSqlError, Effect.flatMap(dieIfMissing))

    const requireOwner = (householdId: string | null, userId: string) =>
      Effect.gen(function* () {
        if (householdId === null) {
          return yield* Effect.fail(new NotHouseholdOwner({}))
        }
        const household = yield* households
          .findById(householdId)
          .pipe(dieOnSqlError, Effect.flatMap(dieIfMissing))
        if (household.createdBy !== userId) {
          return yield* Effect.fail(new NotHouseholdOwner({}))
        }
        return household
      })

    return {
      "household.create": (payload) =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          const household = yield* households
            .create({
              name: payload.name,
              baseCurrency: payload.baseCurrency,
              createdBy: currentUser.userId,
            })
            .pipe(dieOnSqlError)
          yield* Effect.forEach(
            DEFAULT_HOUSEHOLD_CATEGORIES,
            (name, index) =>
              categories.createHousehold({
                householdId: household.id,
                name,
                color: null,
                sortOrder: index,
              }),
            { discard: true },
          ).pipe(dieOnSqlError)
          return toHouseholdView(household)
        }),

      "household.get": () =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          if (currentUser.householdId === null) {
            return null
          }
          const found = yield* households.findById(currentUser.householdId).pipe(dieOnSqlError)
          return Option.match(found, { onNone: () => null, onSome: toHouseholdView })
        }),

      "household.update": (payload) =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          yield* requireHousehold(currentUser.householdId)
          const household = yield* households
            .update(currentUser.householdId as string, {
              name: payload.name,
              baseCurrency: payload.baseCurrency,
            })
            .pipe(dieOnSqlError)
          return toHouseholdView(household)
        }),

      "household.invite": (payload) =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          const household = yield* requireOwner(currentUser.householdId, currentUser.userId)
          const inviter = yield* users
            .findById(currentUser.userId)
            .pipe(dieOnSqlError, Effect.flatMap(dieIfMissing))

          const invitation = yield* inviteMember({
            householdId: household.id,
            invitedBy: currentUser.userId,
            inviterName: inviter.name,
            householdName: household.name,
            email: payload.email,
            locale: inviter.preferredLocale,
          }).pipe(dieOnSqlError)

          return toInvitationView(invitation)
        }),

      "household.listInvitations": () =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          const household = yield* requireHousehold(currentUser.householdId)
          const list = yield* invitations.listByHousehold(household.id).pipe(dieOnSqlError)
          return list.map(toInvitationView)
        }),

      "household.revokeInvitation": (payload) =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          yield* requireOwner(currentUser.householdId, currentUser.userId)
          yield* revokeInvitation(payload.invitationId).pipe(dieOnSqlError)
        }),

      "household.acceptInvitation": (payload) =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          const user = yield* users
            .findById(currentUser.userId)
            .pipe(dieOnSqlError, Effect.flatMap(dieIfMissing))

          const member = yield* acceptInvitation({
            householdId: payload.householdId,
            code: payload.code,
            acceptingUserId: currentUser.userId,
            acceptingUserEmail: user.email,
          }).pipe(dieOnSqlError)

          return toMemberView(member)
        }),

      "household.listMembers": () =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          const household = yield* requireHousehold(currentUser.householdId)
          const members = yield* households.listMembers(household.id).pipe(dieOnSqlError)
          return members.map(toMemberView)
        }),

      "household.removeMember": (payload) =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          const household = yield* requireOwner(currentUser.householdId, currentUser.userId)
          yield* households.removeMember(household.id, payload.userId).pipe(dieOnSqlError)
        }),
    }
  }),
)

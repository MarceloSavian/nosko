import { CurrentUser, RulesRpcs } from "@nosko/contracts"
import { Effect, Option } from "effect"
import { RecurringRulesRepository } from "../../data/protocols/RecurringRulesRepository"
import { NoHousehold } from "../../domain/errors/HouseholdErrors"
import { RecurringRuleNotFound } from "../../domain/errors/RuleErrors"
import type { RecurringRule } from "../../domain/models/RecurringRule"
import { dieOnSqlError } from "./dieOnSqlError"

const toRuleView = (rule: RecurringRule) => ({
  id: rule.id,
  matchType: rule.matchType,
  matcher: rule.matcher,
  expectedAmountMinor: rule.expectedAmountMinor,
  currency: rule.currency,
  categoryId: rule.categoryId,
  cadence: rule.cadence,
  isFixedBill: rule.isFixedBill,
  active: rule.active,
  source: rule.source,
  confidence: rule.confidence,
})

export const RulesGroupLive = RulesRpcs.toLayer(
  Effect.gen(function* () {
    const rulesRepo = yield* RecurringRulesRepository

    const requireHouseholdId = Effect.gen(function* () {
      const currentUser = yield* CurrentUser
      if (currentUser.householdId === null) {
        return yield* Effect.fail(new NoHousehold({}))
      }
      return currentUser.householdId
    })

    const requireRule = (id: string) =>
      rulesRepo.findById(id).pipe(
        dieOnSqlError,
        Effect.flatMap((found) =>
          Option.isNone(found)
            ? Effect.fail(new RecurringRuleNotFound({}))
            : Effect.succeed(found.value),
        ),
      )

    return {
      "rules.list": () =>
        Effect.gen(function* () {
          yield* requireHouseholdId
          const rules = yield* rulesRepo.list().pipe(dieOnSqlError)
          return rules.map(toRuleView)
        }),

      "rules.create": (payload) =>
        Effect.gen(function* () {
          const householdId = yield* requireHouseholdId
          const created = yield* rulesRepo
            .create({
              householdId,
              matchType: payload.matchType,
              matcher: payload.matcher,
              expectedAmountMinor: payload.expectedAmountMinor,
              currency: payload.currency,
              categoryId: payload.categoryId,
              cadence: payload.cadence,
              isFixedBill: payload.isFixedBill,
            })
            .pipe(dieOnSqlError)
          return toRuleView(created)
        }),

      "rules.update": (payload) =>
        Effect.gen(function* () {
          yield* requireRule(payload.id)
          const updated = yield* rulesRepo
            .update(payload.id, {
              matcher: payload.matcher,
              expectedAmountMinor: payload.expectedAmountMinor,
              currency: payload.currency,
              categoryId: payload.categoryId,
              cadence: payload.cadence,
              isFixedBill: payload.isFixedBill,
            })
            .pipe(dieOnSqlError)
          return toRuleView(updated)
        }),

      "rules.deactivate": (payload) =>
        Effect.gen(function* () {
          yield* requireRule(payload.id)
          const updated = yield* rulesRepo.deactivate(payload.id).pipe(dieOnSqlError)
          return toRuleView(updated)
        }),
    }
  }),
)

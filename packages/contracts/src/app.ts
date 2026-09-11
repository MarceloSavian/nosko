import { AccountsRpcs } from "./accounts.ts"
import { AuthRpcs } from "./auth.ts"
import { BillsRpcs } from "./bills.ts"
import { CategoriesRpcs } from "./categories.ts"
import { CyclesRpcs } from "./cycles.ts"
import { HouseholdRpcs } from "./household.ts"
import { IngestionRpcs } from "./ingestion.ts"
import { PaymentsRpcs } from "./payments.ts"
import { RulesRpcs } from "./rules.ts"

export const AppRpcs = AuthRpcs.merge(
  HouseholdRpcs,
  AccountsRpcs,
  CyclesRpcs,
  BillsRpcs,
  RulesRpcs,
  PaymentsRpcs,
  CategoriesRpcs,
  IngestionRpcs,
)

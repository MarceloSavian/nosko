import { AccountsRpcs } from "./accounts"
import { AuthRpcs } from "./auth"
import { BillsRpcs } from "./bills"
import { CyclesRpcs } from "./cycles"
import { HouseholdRpcs } from "./household"
import { PaymentsRpcs } from "./payments"
import { RulesRpcs } from "./rules"

export const AppRpcs = AuthRpcs.merge(
  HouseholdRpcs,
  AccountsRpcs,
  CyclesRpcs,
  BillsRpcs,
  RulesRpcs,
  PaymentsRpcs,
)

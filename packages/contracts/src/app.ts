import { AccountsRpcs } from "./accounts"
import { AuthRpcs } from "./auth"
import { HouseholdRpcs } from "./household"

export const AppRpcs = AuthRpcs.merge(HouseholdRpcs, AccountsRpcs)

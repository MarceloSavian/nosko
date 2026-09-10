import { AuthRpcs } from "./auth"
import { HouseholdRpcs } from "./household"

export const AppRpcs = AuthRpcs.merge(HouseholdRpcs)

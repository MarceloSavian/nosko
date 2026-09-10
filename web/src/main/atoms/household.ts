import { Result, useAtomValue } from "@effect-atom/atom-react"
import type { HouseholdView } from "@nosko/contracts"
import { householdAtom } from "../../data/usecases/household"

export { householdAtom }

export type HouseholdState =
  | { readonly status: "loading" }
  | { readonly status: "none" }
  | { readonly status: "present"; readonly household: HouseholdView }

export const useHousehold = (): HouseholdState => {
  const result = useAtomValue(householdAtom)
  if (Result.isInitial(result)) {
    return { status: "loading" }
  }
  if (Result.isFailure(result)) {
    return { status: "none" }
  }
  return result.value === null ? { status: "none" } : { status: "present", household: result.value }
}

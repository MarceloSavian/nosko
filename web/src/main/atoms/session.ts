import { Result, useAtomValue } from "@effect-atom/atom-react"
import { meAtom } from "../../data/usecases/auth"
import type { Session } from "../../domain/models/Session"

export { meAtom }

// Any auth.me failure (SessionInvalid or otherwise) is treated as unauthenticated: the guards
// below fail closed rather than risk rendering a protected section on an ambiguous error.
export const useSession = (): Session => {
  const result = useAtomValue(meAtom)
  if (Result.isInitial(result)) {
    return { status: "loading" }
  }
  if (Result.isSuccess(result)) {
    return { status: "authenticated", user: result.value }
  }
  return { status: "unauthenticated" }
}

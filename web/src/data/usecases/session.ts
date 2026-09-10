// These 4 endpoints are cookie-writing HttpApi calls, not RPC, so they aren't AtomRpc mutations —
// plain async functions over the infra/http/httpApi port. Pages manage their own loading state
// (useState) around them; main/atoms/session.ts refreshes meAtom after login/logout succeed.

export type { LoginResult } from "../../infra/http/httpApi"
export { login, logout, mfaVerify, refreshSession } from "../../infra/http/httpApi"

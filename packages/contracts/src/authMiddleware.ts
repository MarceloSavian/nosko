import * as RpcMiddleware from "@effect/rpc/RpcMiddleware"
import { Context } from "effect"
import { SessionInvalid } from "./errors/authErrors"

export class CurrentUser extends Context.Tag("CurrentUser")<
  CurrentUser,
  {
    readonly userId: string
    readonly sessionId: string
    readonly householdId: string | null
  }
>() {}

export class AuthMiddleware extends RpcMiddleware.Tag<AuthMiddleware>()("AuthMiddleware", {
  failure: SessionInvalid,
  provides: CurrentUser,
  wrap: true,
}) {}

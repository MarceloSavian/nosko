import { HttpMiddleware } from "@effect/platform"
import { LambdaHandler } from "@effect-aws/lambda"
import { AppLive } from "./layers"

// API Gateway forwards every method (including OPTIONS) to this Lambda via a single $default
// route rather than auto-answering CORS preflights itself, so the app must handle OPTIONS
// cleanly. Without this, RpcServer's mount happens to return 200 for OPTIONS (it just fails to
// parse an empty body as an RPC request), but HttpApiBuilder's stricter router 404s on it,
// which browsers treat as a failed preflight. API Gateway's own cors_configuration is still the
// real access-control boundary on the actual (non-preflight) response.
export const handler = LambdaHandler.fromHttpApi(AppLive, {
  middleware: HttpMiddleware.cors(),
})

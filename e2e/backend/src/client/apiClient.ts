import { FetchHttpClient } from "@effect/platform"
import * as RpcClient from "@effect/rpc/RpcClient"
import * as RpcSerialization from "@effect/rpc/RpcSerialization"
import { AppRpcs } from "@nosko/contracts"
import { Effect, type Either, Layer, ManagedRuntime } from "effect"
import { config } from "../config.ts"
import type { Session } from "./httpApi.ts"

// RPC tags are "<group>.<method>" (e.g. "auth.signUp"), so RpcClient namespaces the generated
// client by prefix: calls look like client.auth.signUp(payload), client.household.create(...).
const ProtocolLive = RpcClient.layerProtocolHttp({
  url: `${config.apiBaseUrl}/api/rpc`,
}).pipe(Layer.provide(Layer.mergeAll(RpcSerialization.layerJson, FetchHttpClient.layer)))

export class ApiClient extends Effect.Service<ApiClient>()("ApiClient", {
  scoped: RpcClient.make(AppRpcs),
  dependencies: [ProtocolLive],
}) {}

// Built once per test file (node:test isolates each file in its own process) and reused across
// every call in that file; call disposeApiRuntime() in an `after` hook to release it cleanly.
export const runtime = ManagedRuntime.make(ApiClient.Default)

export const rpc = <A, E>(f: (client: ApiClient) => Effect.Effect<A, E>): Promise<A> =>
  runtime.runPromise(Effect.flatMap(ApiClient, f))

// For negative-path assertions: resolves to Either.Left(typedError) instead of throwing, so
// tests can assert on the exact tagged error (e.g. result.left._tag === "EmailAlreadyRegistered").
export const rpcEither = <A, E>(
  f: (client: ApiClient) => Effect.Effect<A, E>,
): Promise<Either.Either<A, E>> =>
  runtime.runPromise(Effect.flatMap(ApiClient, (client) => Effect.either(f(client))))

export const disposeApiRuntime = (): Promise<void> => runtime.dispose()

// Auth-required RPCs read the session from the nosko_at cookie (AuthMiddleware has no
// requiredForClient flag, so unauthenticated calls just fail server-side with SessionInvalid).
export const withSession = (
  session: Session,
): { readonly headers: { readonly cookie: string } } => ({
  headers: { cookie: session.jar.header() },
})

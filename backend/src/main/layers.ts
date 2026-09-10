import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder"
import * as HttpServer from "@effect/platform/HttpServer"
import * as RpcSerialization from "@effect/rpc/RpcSerialization"
import * as RpcServer from "@effect/rpc/RpcServer"
import { AppRpcs, AuthApi } from "@nosko/contracts"
import { Effect, Layer } from "effect"
import { AccessTokensLive } from "../infra/auth/AccessTokens"
import { OpaqueTokensLive } from "../infra/auth/OpaqueTokens"
import { PasswordHasherLive } from "../infra/auth/PasswordHasher"
import { TotpServiceLive } from "../infra/auth/TotpService"
import { PgLive } from "../infra/config/DatabaseConfig"
import { SesMailerLive } from "../infra/mailer/SesMailer"
import { AccountsRepositoryLive } from "../infra/repositories/AccountsRepositoryLive"
import { AuthTokensRepositoryLive } from "../infra/repositories/AuthTokensRepositoryLive"
import { FxRatesRepositoryLive } from "../infra/repositories/FxRatesRepositoryLive"
import { HouseholdInvitationsRepositoryLive } from "../infra/repositories/HouseholdInvitationsRepositoryLive"
import { HouseholdsRepositoryLive } from "../infra/repositories/HouseholdsRepositoryLive"
import { UserSessionsRepositoryLive } from "../infra/repositories/UserSessionsRepositoryLive"
import { UsersRepositoryLive } from "../infra/repositories/UsersRepositoryLive"
import { AuthApiLive } from "../presentation/http/AuthApiLive"
import { AccountsGroupLive } from "../presentation/rpc/AccountsGroupLive"
import { AuthGroupLive } from "../presentation/rpc/AuthGroupLive"
import { AuthMiddlewareLive } from "../presentation/rpc/AuthMiddlewareLive"
import { HouseholdGroupLive } from "../presentation/rpc/HouseholdGroupLive"

const RestOfInfraLive = Layer.mergeAll(
  UsersRepositoryLive,
  AuthTokensRepositoryLive,
  UserSessionsRepositoryLive,
  HouseholdsRepositoryLive,
  HouseholdInvitationsRepositoryLive,
  AccountsRepositoryLive,
  FxRatesRepositoryLive,
  PasswordHasherLive,
  TotpServiceLive,
  OpaqueTokensLive,
  AccessTokensLive,
  SesMailerLive,
)

const provideInfra = <A, E, R>(layer: Layer.Layer<A, E, R>) =>
  layer.pipe(Layer.provide(RestOfInfraLive), Layer.provide(PgLive))

const RpcGroupsLive = provideInfra(
  Layer.mergeAll(AuthGroupLive, HouseholdGroupLive, AccountsGroupLive, AuthMiddlewareLive),
)

const RpcMountLive = Layer.scopedDiscard(
  Effect.gen(function* () {
    const router = yield* HttpApiBuilder.Router
    const rpcApp = yield* RpcServer.toHttpApp(AppRpcs)
    yield* router.mountApp("/api/rpc", Effect.scoped(rpcApp))
  }),
).pipe(
  Layer.provide(
    Layer.mergeAll(RpcGroupsLive, RpcSerialization.layerJson, HttpApiBuilder.Router.Live),
  ),
)

const HttpApiLive = HttpApiBuilder.api(AuthApi).pipe(Layer.provide(provideInfra(AuthApiLive)))

const OpenApiLive = HttpApiBuilder.middlewareOpenApi().pipe(Layer.provide(HttpApiLive))

export const AppLive = Layer.mergeAll(
  HttpApiLive,
  OpenApiLive,
  RpcMountLive,
  HttpServer.layerContext,
)

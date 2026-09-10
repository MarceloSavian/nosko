import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder"
import * as HttpServer from "@effect/platform/HttpServer"
import * as RpcSerialization from "@effect/rpc/RpcSerialization"
import * as RpcServer from "@effect/rpc/RpcServer"
import { AppRpcs, NoskoHttpApi } from "@nosko/contracts"
import { Effect, Layer } from "effect"
import { AccessTokensLive } from "../infra/auth/AccessTokens"
import { OpaqueTokensLive } from "../infra/auth/OpaqueTokens"
import { PasswordHasherLive } from "../infra/auth/PasswordHasher"
import { TotpServiceLive } from "../infra/auth/TotpService"
import { PgLive } from "../infra/config/DatabaseConfig"
import { ResendMailerLive } from "../infra/mailer/ResendMailer"
import { AccountsRepositoryLive } from "../infra/repositories/AccountsRepositoryLive"
import { AuthTokensRepositoryLive } from "../infra/repositories/AuthTokensRepositoryLive"
import { CategoryCapsRepositoryLive } from "../infra/repositories/CategoryCapsRepositoryLive"
import { CyclesRepositoryLive } from "../infra/repositories/CyclesRepositoryLive"
import { FixedBillsRepositoryLive } from "../infra/repositories/FixedBillsRepositoryLive"
import { FxRatesRepositoryLive } from "../infra/repositories/FxRatesRepositoryLive"
import { HouseholdInvitationsRepositoryLive } from "../infra/repositories/HouseholdInvitationsRepositoryLive"
import { HouseholdsRepositoryLive } from "../infra/repositories/HouseholdsRepositoryLive"
import { RecurringRulesRepositoryLive } from "../infra/repositories/RecurringRulesRepositoryLive"
import { SharedPaymentsRepositoryLive } from "../infra/repositories/SharedPaymentsRepositoryLive"
import { UserSessionsRepositoryLive } from "../infra/repositories/UserSessionsRepositoryLive"
import { UsersRepositoryLive } from "../infra/repositories/UsersRepositoryLive"
import { AuthApiLive } from "../presentation/http/AuthApiLive"
import { PaymentsApiLive } from "../presentation/http/PaymentsApiLive"
import { AccountsGroupLive } from "../presentation/rpc/AccountsGroupLive"
import { AuthGroupLive } from "../presentation/rpc/AuthGroupLive"
import { AuthMiddlewareLive } from "../presentation/rpc/AuthMiddlewareLive"
import { BillsGroupLive } from "../presentation/rpc/BillsGroupLive"
import { CyclesGroupLive } from "../presentation/rpc/CyclesGroupLive"
import { HouseholdGroupLive } from "../presentation/rpc/HouseholdGroupLive"
import { PaymentsGroupLive } from "../presentation/rpc/PaymentsGroupLive"
import { RulesGroupLive } from "../presentation/rpc/RulesGroupLive"

const RestOfInfraLive = Layer.mergeAll(
  UsersRepositoryLive,
  AuthTokensRepositoryLive,
  UserSessionsRepositoryLive,
  HouseholdsRepositoryLive,
  HouseholdInvitationsRepositoryLive,
  AccountsRepositoryLive,
  FxRatesRepositoryLive,
  CyclesRepositoryLive,
  FixedBillsRepositoryLive,
  RecurringRulesRepositoryLive,
  CategoryCapsRepositoryLive,
  SharedPaymentsRepositoryLive,
  PasswordHasherLive,
  TotpServiceLive,
  OpaqueTokensLive,
  AccessTokensLive,
  ResendMailerLive,
)

const provideInfra = <A, E, R>(layer: Layer.Layer<A, E, R>) =>
  layer.pipe(Layer.provide(RestOfInfraLive), Layer.provide(PgLive))

const RpcGroupsLive = provideInfra(
  Layer.mergeAll(
    AuthGroupLive,
    HouseholdGroupLive,
    AccountsGroupLive,
    CyclesGroupLive,
    BillsGroupLive,
    RulesGroupLive,
    PaymentsGroupLive,
    AuthMiddlewareLive,
  ),
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

const HttpApiLive = HttpApiBuilder.api(NoskoHttpApi).pipe(
  Layer.provide(provideInfra(Layer.mergeAll(AuthApiLive, PaymentsApiLive))),
)

const OpenApiLive = HttpApiBuilder.middlewareOpenApi().pipe(Layer.provide(HttpApiLive))

export const AppLive = Layer.mergeAll(
  HttpApiLive,
  OpenApiLive,
  RpcMountLive,
  HttpServer.layerContext,
)

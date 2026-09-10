import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { Effect, Layer } from "effect"
import { PgLive } from "../infra/config/DatabaseConfig.ts"
import { MigrationsLive } from "../infra/db/Migrations.ts"

const program = Effect.scoped(Layer.build(MigrationsLive)).pipe(
  Effect.provide(Layer.merge(PgLive, NodeContext.layer)),
)

NodeRuntime.runMain(program)

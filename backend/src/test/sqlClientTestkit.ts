import { Reactivity } from "@effect/experimental"
import { SqlClient, Statement } from "@effect/sql"
import type { Connection } from "@effect/sql/SqlConnection"
import { PgClient } from "@effect/sql-pg"
import { Effect, Layer, String as Str, Stream } from "effect"

export interface RecordedQuery {
  readonly sql: string
  readonly params: ReadonlyArray<unknown>
}

export type Responder = (query: RecordedQuery) => ReadonlyArray<Record<string, unknown>>

export const makeTestSqlClient = (responder: Responder) => {
  const queries: Array<RecordedQuery> = []

  const respond = (sql: string, params: ReadonlyArray<unknown>) => {
    queries.push({ sql, params })
    return responder({ sql, params })
  }

  const connection: Connection = {
    execute: (sql, params, transformRows) =>
      Effect.sync(() => {
        const rows = respond(sql, params)
        return transformRows ? transformRows(rows) : rows
      }),
    executeRaw: (sql, params) => Effect.sync(() => respond(sql, params)),
    executeValues: (sql, params) =>
      Effect.sync(() => respond(sql, params).map((row) => Object.values(row))),
    executeUnprepared: (sql, params, transformRows) =>
      Effect.sync(() => {
        const rows = respond(sql, params)
        return transformRows ? transformRows(rows) : rows
      }),
    executeStream: () => Stream.die("executeStream is not implemented in the test SqlClient"),
  }

  const compiler = PgClient.makeCompiler(Str.camelToSnake, true)

  const layer = Layer.effect(
    SqlClient.SqlClient,
    SqlClient.make({
      acquirer: Effect.succeed(connection),
      compiler,
      spanAttributes: [],
      transformRows: Statement.defaultTransforms(Str.snakeToCamel).array,
    }),
  ).pipe(Layer.provide(Reactivity.layer))

  return { layer, queries }
}

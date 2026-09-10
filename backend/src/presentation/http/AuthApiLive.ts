import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder"
import * as HttpServerRequest from "@effect/platform/HttpServerRequest"
import * as HttpServerResponse from "@effect/platform/HttpServerResponse"
import { SqlClient } from "@effect/sql"
import { AuthApi } from "@nosko/contracts"
import { Effect, Option } from "effect"
import { login, mfaVerify } from "../../data/usecases/Login"
import { logout, refreshSession } from "../../data/usecases/Sessions"
import { SessionInvalid } from "../../domain/errors/AuthErrors"
import { AccessTokens } from "../../infra/auth/AccessTokens"
import {
  clearSessionCookies,
  readAccessTokenFromHeaders,
  readRefreshTokenFromHeaders,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "../../infra/auth/SessionCookies"
import { withRlsScope } from "../../infra/db/RequestScope"
import { dieOnSqlError } from "../rpc/dieOnSqlError"

const currentRequestHeaders = Effect.map(
  HttpServerRequest.HttpServerRequest,
  (request) => request.headers,
)

const jsonOrDie = (body: unknown) => HttpServerResponse.json(body).pipe(Effect.orDie)

export const AuthApiLive = HttpApiBuilder.group(AuthApi, "auth", (handlers) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const accessTokens = yield* AccessTokens

    return handlers
      .handle("login", ({ payload }) =>
        Effect.gen(function* () {
          const result = yield* sql
            .withTransaction(
              login(
                payload.deviceToken === undefined
                  ? { email: payload.email, password: payload.password }
                  : {
                      email: payload.email,
                      password: payload.password,
                      deviceToken: payload.deviceToken,
                    },
              ),
            )
            .pipe(dieOnSqlError)

          if (result.status === "mfa_required") {
            return yield* jsonOrDie({
              status: "mfa_required" as const,
              userId: result.userId,
            })
          }

          const response = yield* jsonOrDie({
            status: "authenticated" as const,
            userId: result.userId,
          })
          return setRefreshTokenCookie(
            setAccessTokenCookie(response, result.accessToken),
            result.refreshToken,
          )
        }),
      )
      .handle("mfaVerify", ({ payload }) =>
        Effect.gen(function* () {
          const result = yield* withRlsScope({ userId: payload.userId }, mfaVerify(payload))

          const response = yield* jsonOrDie({ userId: result.userId })
          return setRefreshTokenCookie(
            setAccessTokenCookie(response, result.accessToken),
            result.refreshToken,
          )
        }),
      )
      .handle("refresh", () =>
        Effect.gen(function* () {
          const headers = yield* currentRequestHeaders
          const accessToken = readAccessTokenFromHeaders(headers)
          const refreshToken = readRefreshTokenFromHeaders(headers)
          if (Option.isNone(accessToken) || Option.isNone(refreshToken)) {
            return yield* Effect.fail(new SessionInvalid({ reason: "not_found" }))
          }

          const claims = yield* accessTokens.decodeUnverified(accessToken.value)
          const result = yield* withRlsScope(
            { userId: claims.userId },
            refreshSession(claims.userId, refreshToken.value),
          )

          const response = yield* jsonOrDie(null)
          return setAccessTokenCookie(response, result.accessToken)
        }),
      )
      .handle("logout", () =>
        Effect.gen(function* () {
          const headers = yield* currentRequestHeaders
          const accessToken = readAccessTokenFromHeaders(headers)
          const claims = Option.isSome(accessToken)
            ? yield* Effect.option(accessTokens.verify(accessToken.value))
            : Option.none()

          if (Option.isSome(claims)) {
            yield* withRlsScope(
              { userId: claims.value.userId },
              logout(claims.value.userId, claims.value.sessionId),
            ).pipe(Effect.ignore)
          }

          const response = yield* jsonOrDie(null)
          return clearSessionCookies(response)
        }),
      )
  }),
)

import type { Cookie } from "@effect/platform/Cookies"
import * as Cookies from "@effect/platform/Cookies"
import * as HttpServerResponse from "@effect/platform/HttpServerResponse"
import { Duration, Option } from "effect"

export const ACCESS_TOKEN_COOKIE = "nosko_at"
export const REFRESH_TOKEN_COOKIE = "nosko_rt"

const ACCESS_TOKEN_MAX_AGE = Duration.minutes(15)
const REFRESH_TOKEN_MAX_AGE = Duration.days(30)

const REFRESH_TOKEN_PATH = "/api/http/auth"

const baseOptions: Cookie["options"] = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  path: "/",
}

const refreshOptions: Cookie["options"] = {
  ...baseOptions,
  path: REFRESH_TOKEN_PATH,
}

export const setAccessTokenCookie = (
  response: HttpServerResponse.HttpServerResponse,
  accessToken: string,
): HttpServerResponse.HttpServerResponse =>
  HttpServerResponse.unsafeSetCookie(response, ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  })

export const setRefreshTokenCookie = (
  response: HttpServerResponse.HttpServerResponse,
  refreshToken: string,
): HttpServerResponse.HttpServerResponse =>
  HttpServerResponse.unsafeSetCookie(response, REFRESH_TOKEN_COOKIE, refreshToken, {
    ...refreshOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  })

export const clearSessionCookies = (
  response: HttpServerResponse.HttpServerResponse,
): HttpServerResponse.HttpServerResponse =>
  HttpServerResponse.expireCookie(
    HttpServerResponse.expireCookie(response, ACCESS_TOKEN_COOKIE, baseOptions),
    REFRESH_TOKEN_COOKIE,
    refreshOptions,
  )

const readCookieFromHeaders = (
  name: string,
  headers: Readonly<Record<string, string>>,
): Option.Option<string> => {
  const cookieHeader = headers.cookie
  if (cookieHeader === undefined) {
    return Option.none()
  }
  return Option.fromNullable(Cookies.parseHeader(cookieHeader)[name])
}

export const readAccessTokenFromHeaders = (
  headers: Readonly<Record<string, string>>,
): Option.Option<string> => readCookieFromHeaders(ACCESS_TOKEN_COOKIE, headers)

export const readRefreshTokenFromHeaders = (
  headers: Readonly<Record<string, string>>,
): Option.Option<string> => readCookieFromHeaders(REFRESH_TOKEN_COOKIE, headers)

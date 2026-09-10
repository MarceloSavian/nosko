import * as Cookies from "@effect/platform/Cookies"
import * as HttpServerResponse from "@effect/platform/HttpServerResponse"
import { describe, expect, it } from "@jest/globals"
import { Option } from "effect"
import {
  ACCESS_TOKEN_COOKIE,
  clearSessionCookies,
  REFRESH_TOKEN_COOKIE,
  readAccessTokenFromHeaders,
  readRefreshTokenFromHeaders,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "./SessionCookies"

describe("setAccessTokenCookie", () => {
  it("sets an httpOnly, secure, strict, root-path cookie with a 15 minute max age", () => {
    const response = setAccessTokenCookie(HttpServerResponse.empty(), "access-token-value")
    const cookie = Option.getOrThrow(Cookies.get(response.cookies, ACCESS_TOKEN_COOKIE))

    expect(cookie.value).toBe("access-token-value")
    expect(cookie.options).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
    })
    expect(cookie.options?.maxAge).toBeDefined()
  })
})

describe("setRefreshTokenCookie", () => {
  it("sets an httpOnly, secure, strict, auth-path cookie with a 30 day max age", () => {
    const response = setRefreshTokenCookie(HttpServerResponse.empty(), "refresh-token-value")
    const cookie = Option.getOrThrow(Cookies.get(response.cookies, REFRESH_TOKEN_COOKIE))

    expect(cookie.value).toBe("refresh-token-value")
    expect(cookie.options).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/api/http/auth",
    })
    expect(cookie.options?.maxAge).toBeDefined()
  })
})

describe("clearSessionCookies", () => {
  it("expires both cookies on their original paths", () => {
    const response = clearSessionCookies(HttpServerResponse.empty())
    const accessCookie = Option.getOrThrow(Cookies.get(response.cookies, ACCESS_TOKEN_COOKIE))
    const refreshCookie = Option.getOrThrow(Cookies.get(response.cookies, REFRESH_TOKEN_COOKIE))

    expect(accessCookie.options?.path).toBe("/")
    expect(refreshCookie.options?.path).toBe("/api/http/auth")
    const headers = Cookies.toSetCookieHeaders(response.cookies)
    expect(headers.some((header) => header.includes("Max-Age=0"))).toBe(true)
  })
})

describe("readAccessTokenFromHeaders", () => {
  it("reads the access token from a Cookie header", () => {
    const found = readAccessTokenFromHeaders({
      cookie: `${ACCESS_TOKEN_COOKIE}=abc123; other=xyz`,
    })
    expect(found).toEqual(Option.some("abc123"))
  })

  it("returns none when there is no Cookie header", () => {
    expect(readAccessTokenFromHeaders({})).toEqual(Option.none())
  })

  it("returns none when the Cookie header does not carry the access token", () => {
    expect(readAccessTokenFromHeaders({ cookie: "other=xyz" })).toEqual(Option.none())
  })
})

describe("readRefreshTokenFromHeaders", () => {
  it("reads the refresh token from a Cookie header", () => {
    const found = readRefreshTokenFromHeaders({
      cookie: `${REFRESH_TOKEN_COOKIE}=xyz789; other=abc`,
    })
    expect(found).toEqual(Option.some("xyz789"))
  })

  it("returns none when there is no Cookie header", () => {
    expect(readRefreshTokenFromHeaders({})).toEqual(Option.none())
  })

  it("returns none when the Cookie header does not carry the refresh token", () => {
    expect(readRefreshTokenFromHeaders({ cookie: "other=xyz" })).toEqual(Option.none())
  })
})

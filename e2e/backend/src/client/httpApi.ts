import { config } from "../config.ts"
import { CookieJar } from "./cookieJar.ts"

// The 4 cookie-writing auth endpoints and CSV export are plain HttpApi (not RPC), so they are
// called with fetch directly rather than through the RpcClient in apiClient.ts.

export class Session {
  readonly jar = new CookieJar()
}

export class HttpApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, body: unknown) {
    super(`HttpApi request failed with status ${status}: ${JSON.stringify(body)}`)
    this.status = status
    this.body = body
  }
}

const request = async (
  session: Session,
  method: "GET" | "POST",
  path: string,
  payload?: unknown,
): Promise<Response> => {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method,
    headers: {
      ...(payload === undefined ? {} : { "content-type": "application/json" }),
      cookie: session.jar.header(),
    },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  })
  session.jar.applyResponse(response)
  return response
}

const parseJsonOrThrow = async (response: Response): Promise<unknown> => {
  const body = await response.json()
  if (!response.ok) {
    throw new HttpApiError(response.status, body)
  }
  return body
}

export type LoginResult =
  | { readonly status: "authenticated"; readonly userId: string }
  | { readonly status: "mfa_required"; readonly userId: string }

export const login = async (
  session: Session,
  input: { readonly email: string; readonly password: string; readonly deviceToken?: string },
): Promise<LoginResult> => {
  const response = await request(session, "POST", "/api/http/auth/login", input)
  return (await parseJsonOrThrow(response)) as LoginResult
}

export const mfaVerify = async (
  session: Session,
  input: { readonly userId: string; readonly code: string; readonly rememberDevice: boolean },
): Promise<{ readonly userId: string }> => {
  const response = await request(session, "POST", "/api/http/auth/mfa-verify", input)
  return (await parseJsonOrThrow(response)) as { readonly userId: string }
}

export const refreshSession = async (session: Session): Promise<void> => {
  const response = await request(session, "POST", "/api/http/auth/refresh")
  await parseJsonOrThrow(response)
}

export const logout = async (session: Session): Promise<void> => {
  const response = await request(session, "POST", "/api/http/auth/logout")
  await parseJsonOrThrow(response)
}

export const exportCsv = async (session: Session, cycleId: string): Promise<string> => {
  const response = await request(
    session,
    "GET",
    `/api/http/payments/export?${new URLSearchParams({ cycleId })}`,
  )
  if (!response.ok) {
    const body = await response.json().catch(() => undefined)
    throw new HttpApiError(response.status, body)
  }
  return await response.text()
}

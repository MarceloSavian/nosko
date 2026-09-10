import { apiBaseUrl } from "./apiClient"

// The 4 cookie-writing auth endpoints and CSV export are plain HttpApi, not RPC, so they're
// called with fetch directly. This is the infra "protocol" port data/usecases/session.ts depends
// on; presentation never touches fetch or this module directly.

export class HttpApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, body: unknown) {
    super(`Request failed with status ${status}`)
    this.status = status
    this.body = body
  }
}

const request = async (
  method: "GET" | "POST",
  path: string,
  payload?: unknown,
): Promise<Response> =>
  fetch(`${apiBaseUrl}${path}`, {
    method,
    credentials: "include",
    headers: payload === undefined ? {} : { "content-type": "application/json" },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  })

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

export const login = async (input: {
  readonly email: string
  readonly password: string
  readonly deviceToken?: string
}): Promise<LoginResult> =>
  (await parseJsonOrThrow(await request("POST", "/api/http/auth/login", input))) as LoginResult

export const mfaVerify = async (input: {
  readonly userId: string
  readonly code: string
  readonly rememberDevice: boolean
}): Promise<{ readonly userId: string }> =>
  (await parseJsonOrThrow(await request("POST", "/api/http/auth/mfa-verify", input))) as {
    readonly userId: string
  }

export const refreshSession = async (): Promise<void> => {
  await parseJsonOrThrow(await request("POST", "/api/http/auth/refresh"))
}

export const logout = async (): Promise<void> => {
  await parseJsonOrThrow(await request("POST", "/api/http/auth/logout"))
}

export const exportCsv = async (cycleId: string): Promise<string> => {
  const response = await request(
    "GET",
    `/api/http/payments/export?${new URLSearchParams({ cycleId })}`,
  )
  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? ""
    const body = contentType.includes("application/json") ? await response.json() : undefined
    throw new HttpApiError(response.status, body)
  }
  return response.text()
}

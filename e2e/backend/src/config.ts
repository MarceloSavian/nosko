const requireEnv = (name: string): string => {
  const value = process.env[name]
  if (value === undefined || value === "") {
    throw new Error(
      `Missing required env var ${name}. The e2e suite runs against a real deployed backend ` +
        `and its Neon admin connection — set it before running "pnpm test:e2e:backend".`,
    )
  }
  return value
}

export const config = {
  apiBaseUrl: (process.env.E2E_API_BASE_URL ?? "https://test.api.nosko.app").replace(/\/$/, ""),
  get databaseUrl(): string {
    return requireEnv("DATABASE_URL")
  },
}

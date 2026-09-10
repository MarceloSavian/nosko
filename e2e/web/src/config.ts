const requireEnv = (name: string): string => {
  const value = process.env[name]
  if (value === undefined || value === "") {
    throw new Error(
      `Missing required env var ${name}. This suite drives a real browser against the deployed ` +
        `test API's Neon admin connection to recover verification codes and clean up test data — ` +
        `set it before running "pnpm test:e2e:web".`,
    )
  }
  return value
}

export const config = {
  get databaseUrl(): string {
    return requireEnv("DATABASE_URL")
  },
}

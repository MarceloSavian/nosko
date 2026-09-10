import { existsSync } from "node:fs"
import path from "node:path"
import { defineConfig, devices } from "@playwright/test"

// Loads DATABASE_URL (and anything else) from .env into process.env before workers spawn — they
// inherit it as a normal subprocess env var, same effect as e2e/backend's --env-file-if-exists.
const envPath = path.join(import.meta.dirname, ".env")
if (existsSync(envPath)) {
  process.loadEnvFile(envPath)
}

const PORT = 4173
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Runs against the real deployed test API through the Vite dev-server proxy
    // (web/vite.config.ts) — the same setup real local dev uses, so this suite exercises real
    // browser CORS/cookie/SameSite behavior end to end, not a mocked approximation of it.
    command: `pnpm exec vite --port ${PORT} --strictPort`,
    cwd: "../../web",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})

import type { Page } from "@playwright/test"
import { expect } from "@playwright/test"
import type { AdminDb } from "../db.ts"
import { findAuthTokenCode } from "./codes.ts"
import { TEST_PASSWORD, uniqueEmail, uniqueName } from "./testData.ts"

// Fills each OtpInput box directly via its own locator rather than clicking box 1 and typing
// the whole code: each <input maxLength={1}> silently rejects further keystrokes once it
// already holds a digit (e.g. after a prior wrong-code attempt), so typing into a refocused but
// still-filled box does nothing. .fill() replaces the value directly, sidestepping that, and
// still triggers the component's own auto-advance-focus onChange handler.
export const fillOtp = async (page: Page, code: string): Promise<void> => {
  for (let i = 0; i < code.length; i++) {
    await page.locator(`input[aria-label="Digit ${i + 1}"]`).fill(code[i] ?? "")
  }
}

// Drives the real signup + email-verification + login UI (the primary actor's full path to an
// authenticated session), recovering the verification code the same way e2e/backend does
// (direct DB read + local brute force). Verifying alone doesn't create a session — only
// login/mfaVerify/refresh write cookies — so this logs in afterwards, same as a real user must.
export const signUpVerifyAndLand = async (
  page: Page,
  db: AdminDb,
  label: string,
): Promise<{ readonly userId: string; readonly email: string }> => {
  const email = uniqueEmail(label)
  const name = uniqueName(label)

  await page.goto("/signup")
  await page.getByLabel("Nome completo").fill(name)
  await page.getByLabel("E-mail", { exact: true }).fill(email)
  await page.getByLabel("Senha", { exact: true }).fill(TEST_PASSWORD)
  await page.getByLabel("Confirmar senha").fill(TEST_PASSWORD)
  await page.getByRole("button", { name: "Criar conta" }).click()
  await expect(page).toHaveURL(/\/verify-email\?userId=/)
  const userId = new URL(page.url()).searchParams.get("userId")
  if (userId === null) throw new Error("expected a userId in the verify-email URL")

  const code = await findAuthTokenCode(db, userId, "email_verify")
  await fillOtp(page, code)
  await page.getByRole("button", { name: "Confirmar código" }).click()
  await expect(page).toHaveURL(/\/login\?verified=1/)

  await page.getByLabel("E-mail", { exact: true }).fill(email)
  await page.getByLabel("Senha", { exact: true }).fill(TEST_PASSWORD)
  await page.getByRole("button", { name: "Entrar no nosko" }).click()
  await expect(page).toHaveURL(/\/onboarding\/household/)

  return { userId, email }
}

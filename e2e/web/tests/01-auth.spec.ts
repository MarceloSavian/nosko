import { expect, test } from "@playwright/test"
import { type AdminDb, closeAdminDb, connectAdminDb } from "../src/db.ts"
import { cleanupTestData } from "../src/helpers/cleanup.ts"
import { findAuthTokenCode } from "../src/helpers/codes.ts"
import { TEST_PASSWORD, uniqueEmail, uniqueName } from "../src/helpers/testData.ts"
import { fillOtp } from "../src/helpers/uiFlows.ts"

test.describe("auth: landing, signup, verification, login, forgot/reset password", () => {
  let db: AdminDb
  const userIds: string[] = []

  test.beforeAll(async () => {
    db = await connectAdminDb()
  })

  test.afterAll(async () => {
    await cleanupTestData(db, { userIds })
    await closeAdminDb(db)
  })

  test("landing page shows both entry points and the language toggle", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: "Bem-vindo ao nosko" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Entrar com credenciais" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Criar nova conta de casal" })).toBeVisible()

    await page.getByRole("button", { name: "EN" }).click()
    await expect(page.getByRole("heading", { name: "Welcome to nosko" })).toBeVisible()
  })

  test("signup rejects a duplicate email, then succeeds and reaches verify-email", async ({
    page,
  }) => {
    const email = uniqueEmail("dup")
    const name = uniqueName("dup")

    await page.goto("/signup")
    await page.getByLabel("Nome completo").fill(name)
    await page.getByLabel("E-mail", { exact: true }).fill(email)
    await page.getByLabel("Senha", { exact: true }).fill(TEST_PASSWORD)
    await page.getByLabel("Confirmar senha").fill(TEST_PASSWORD)
    await page.getByRole("button", { name: "Criar conta" }).click()
    await expect(page).toHaveURL(/\/verify-email\?userId=/)

    const userId = new URL(page.url()).searchParams.get("userId")
    expect(userId).not.toBeNull()
    if (userId) userIds.push(userId)

    // Same email again, from a fresh signup page, must be rejected.
    await page.goto("/signup")
    await page.getByLabel("Nome completo").fill(uniqueName("dup2"))
    await page.getByLabel("E-mail", { exact: true }).fill(email)
    await page.getByLabel("Senha", { exact: true }).fill(TEST_PASSWORD)
    await page.getByLabel("Confirmar senha").fill(TEST_PASSWORD)
    await page.getByRole("button", { name: "Criar conta" }).click()
    await expect(page.getByRole("alert")).toContainText("já está cadastrado")
    await expect(page).toHaveURL(/\/signup/)
  })

  test("signup validation blocks mismatched passwords before submitting", async ({ page }) => {
    await page.goto("/signup")
    await page.getByLabel("Nome completo").fill(uniqueName("mismatch"))
    await page.getByLabel("E-mail", { exact: true }).fill(uniqueEmail("mismatch"))
    await page.getByLabel("Senha", { exact: true }).fill(TEST_PASSWORD)
    await page.getByLabel("Confirmar senha").fill("something-else-entirely")
    await expect(page.getByRole("button", { name: "Criar conta" })).toBeDisabled()
    await expect(page.getByText("As senhas não coincidem.")).toBeVisible()
  })

  test("rejects login before email verification, then verifies and logs in", async ({ page }) => {
    const email = uniqueEmail("verify-flow")
    const name = uniqueName("verify-flow")

    await page.goto("/signup")
    await page.getByLabel("Nome completo").fill(name)
    await page.getByLabel("E-mail", { exact: true }).fill(email)
    await page.getByLabel("Senha", { exact: true }).fill(TEST_PASSWORD)
    await page.getByLabel("Confirmar senha").fill(TEST_PASSWORD)
    await page.getByRole("button", { name: "Criar conta" }).click()
    await expect(page).toHaveURL(/\/verify-email\?userId=/)
    const userId = new URL(page.url()).searchParams.get("userId")
    expect(userId).not.toBeNull()
    if (userId) userIds.push(userId)

    // Login before verifying must fail.
    await page.goto("/login")
    await page.getByLabel("E-mail", { exact: true }).fill(email)
    await page.getByLabel("Senha", { exact: true }).fill(TEST_PASSWORD)
    await page.getByRole("button", { name: "Entrar no nosko" }).click()
    await expect(page.getByRole("alert")).toContainText("Verifique seu e-mail")

    // Verify with a wrong code first.
    await page.goto(`/verify-email?userId=${userId}`)
    await fillOtp(page, "000000")
    await page.getByRole("button", { name: "Confirmar código" }).click()
    await expect(page.getByRole("alert")).toContainText("inválido ou expirado")

    // Recover the real code the same way e2e/backend does and verify for real.
    if (!userId) throw new Error("expected a userId")
    const code = await findAuthTokenCode(db, userId, "email_verify")
    await fillOtp(page, code)
    await page.getByRole("button", { name: "Confirmar código" }).click()
    // Verifying doesn't create a session — lands back on login, now with the success banner.
    await expect(page).toHaveURL(/\/login\?verified=1/)
    await expect(page.getByText("Email verificado.")).toBeVisible()

    await page.getByLabel("E-mail", { exact: true }).fill(email)
    await page.getByLabel("Senha", { exact: true }).fill(TEST_PASSWORD)
    await page.getByRole("button", { name: "Entrar no nosko" }).click()
    await expect(page).toHaveURL(/\/onboarding\/household/)
  })

  test("rejects login with the wrong password", async ({ page }) => {
    const email = uniqueEmail("wrongpass")
    const name = uniqueName("wrongpass")

    await page.goto("/signup")
    await page.getByLabel("Nome completo").fill(name)
    await page.getByLabel("E-mail", { exact: true }).fill(email)
    await page.getByLabel("Senha", { exact: true }).fill(TEST_PASSWORD)
    await page.getByLabel("Confirmar senha").fill(TEST_PASSWORD)
    await page.getByRole("button", { name: "Criar conta" }).click()
    await expect(page).toHaveURL(/\/verify-email\?userId=/)
    const userId = new URL(page.url()).searchParams.get("userId")
    if (userId) userIds.push(userId)

    await page.goto("/login")
    await page.getByLabel("E-mail", { exact: true }).fill(email)
    await page.getByLabel("Senha", { exact: true }).fill("not-the-password")
    await page.getByRole("button", { name: "Entrar no nosko" }).click()
    await expect(page.getByRole("alert")).toContainText("incorretos")
  })

  test("forgot password always shows the same success state, and reset password changes it", async ({
    page,
  }) => {
    const email = uniqueEmail("reset-flow")
    const name = uniqueName("reset-flow")

    await page.goto("/signup")
    await page.getByLabel("Nome completo").fill(name)
    await page.getByLabel("E-mail", { exact: true }).fill(email)
    await page.getByLabel("Senha", { exact: true }).fill(TEST_PASSWORD)
    await page.getByLabel("Confirmar senha").fill(TEST_PASSWORD)
    await page.getByRole("button", { name: "Criar conta" }).click()
    await expect(page).toHaveURL(/\/verify-email\?userId=/)
    const userId = new URL(page.url()).searchParams.get("userId")
    expect(userId).not.toBeNull()
    if (userId) userIds.push(userId)
    if (!userId) throw new Error("expected a userId")

    const verifyCode = await findAuthTokenCode(db, userId, "email_verify")
    await fillOtp(page, verifyCode)
    await page.getByRole("button", { name: "Confirmar código" }).click()
    await expect(page).toHaveURL(/\/login\?verified=1/)

    // Unknown or known email must show the identical success state (never reveals registration).
    await page.goto("/forgot-password")
    await page.getByLabel("E-mail", { exact: true }).fill(email)
    await page.getByRole("button", { name: "Enviar link de recuperação" }).click()
    await expect(page.getByText("Link enviado com sucesso!")).toBeVisible()

    const resetCode = await findAuthTokenCode(db, userId, "password_reset")
    const newPassword = "New-Correct-Horse-9!"
    await page.goto(`/reset-password?email=${encodeURIComponent(email)}&code=${resetCode}`)
    await page.getByLabel("Nova senha", { exact: true }).fill(newPassword)
    await page.getByLabel("Confirmar nova senha").fill(newPassword)
    await page.getByRole("button", { name: "Salvar nova senha" }).click()
    await expect(page).toHaveURL(/\/login/)

    // Old password must no longer work; new one must.
    await page.getByLabel("E-mail", { exact: true }).fill(email)
    await page.getByLabel("Senha", { exact: true }).fill(TEST_PASSWORD)
    await page.getByRole("button", { name: "Entrar no nosko" }).click()
    await expect(page.getByRole("alert")).toContainText("incorretos")

    await page.getByLabel("Senha", { exact: true }).fill(newPassword)
    await page.getByRole("button", { name: "Entrar no nosko" }).click()
    await expect(page).toHaveURL(/\/onboarding\/household/)
  })
})

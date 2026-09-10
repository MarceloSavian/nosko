import { expect, test } from "@playwright/test"
import { type AdminDb, closeAdminDb, connectAdminDb } from "../src/db.ts"
import { cleanupTestData } from "../src/helpers/cleanup.ts"
import { signUpVerifyAndLand } from "../src/helpers/uiFlows.ts"

test.describe("auth guards", () => {
  test("an unauthenticated visitor is redirected to /login from every protected route", async ({
    page,
  }) => {
    for (const path of [
      "/household",
      "/household/accounts",
      "/onboarding/household",
      "/onboarding/accounts",
      "/settings",
    ]) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login/)
    }
  })
})

test.describe("shell: space switcher, nav, guards while authenticated, logout", () => {
  let db: AdminDb
  const userIds: string[] = []
  const householdIds: string[] = []

  test.beforeAll(async () => {
    db = await connectAdminDb()
  })

  test.afterAll(async () => {
    await cleanupTestData(db, { householdIds, userIds })
    await closeAdminDb(db)
  })

  test("household-less user hitting /household directly is sent back to onboarding", async ({
    page,
  }) => {
    const { userId } = await signUpVerifyAndLand(page, db, "guard-nohh")
    userIds.push(userId)

    await page.goto("/household")
    await expect(page).toHaveURL(/\/onboarding\/household/)
  })

  test("authenticated visitor is redirected away from the public auth pages", async ({ page }) => {
    const { userId } = await signUpVerifyAndLand(page, db, "guard-auth")
    userIds.push(userId)
    await page.getByLabel("Nome da residência").fill("E2E Guard Household")
    await page.getByRole("button", { name: "Continuar" }).click()
    await page.getByRole("button", { name: "Fazer isso mais tarde" }).click()
    await expect(page).toHaveURL(/\/onboarding\/accounts/)

    const { rows } = await db.query<{ id: string }>(
      "SELECT id FROM households WHERE created_by = $1",
      [userId],
    )
    const householdId = rows[0]?.id
    if (householdId !== undefined) householdIds.push(householdId)

    for (const path of ["/", "/login", "/signup"]) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/household/)
    }
  })

  test("switches between Casa and Pessoal, navigates nav links, and logs out", async ({ page }) => {
    const { userId } = await signUpVerifyAndLand(page, db, "guard-shell")
    userIds.push(userId)
    await page.getByLabel("Nome da residência").fill("E2E Shell Household")
    await page.getByRole("button", { name: "Continuar" }).click()
    await page.getByRole("button", { name: "Fazer isso mais tarde" }).click()
    await page.getByRole("button", { name: "Configurar contas adicionais mais tarde" }).click()
    await expect(page).toHaveURL(/\/household$/)

    const { rows } = await db.query<{ id: string }>(
      "SELECT id FROM households WHERE created_by = $1",
      [userId],
    )
    const householdId = rows[0]?.id
    if (householdId !== undefined) householdIds.push(householdId)

    await page.getByRole("link", { name: "Contas compartilhadas" }).click()
    await expect(page).toHaveURL(/\/household\/accounts/)
    await expect(page.getByRole("heading", { name: "Contas compartilhadas" })).toBeVisible()

    await page.getByRole("link", { name: "Pessoal" }).click()
    await expect(page).toHaveURL(/\/personal$/)
    await expect(page.getByText("Só você vê isto")).toBeVisible()

    await page.getByRole("link", { name: "Minhas contas" }).click()
    await expect(page).toHaveURL(/\/personal\/accounts/)

    await page.getByRole("link", { name: "Casa", exact: true }).click()
    await expect(page).toHaveURL(/\/household$/)

    await page.getByRole("button", { name: "Sair" }).click()
    await expect(page).toHaveURL(/\/login|\/$/)

    await page.goto("/household")
    await expect(page).toHaveURL(/\/login/)
  })
})

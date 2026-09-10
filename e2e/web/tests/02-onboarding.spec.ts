import { expect, test } from "@playwright/test"
import { type AdminDb, closeAdminDb, connectAdminDb } from "../src/db.ts"
import { cleanupTestData } from "../src/helpers/cleanup.ts"
import { uniqueEmail } from "../src/helpers/testData.ts"
import { signUpVerifyAndLand } from "../src/helpers/uiFlows.ts"

test.describe("onboarding: create household, invite partner, add accounts", () => {
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

  test("creates a household, sends an invite, adds a personal and a shared account", async ({
    page,
  }) => {
    const { userId } = await signUpVerifyAndLand(page, db, "onboard")
    userIds.push(userId)

    await expect(page.getByRole("heading", { name: "Crie sua casa" })).toBeVisible()
    await page.getByLabel("Nome da residência").fill("E2E Web Household")
    await page.getByRole("button", { name: "BRL" }).click()
    await page.getByRole("button", { name: "Continuar" }).click()

    await expect(page.getByRole("heading", { name: "Convidar parceiro(a)" })).toBeVisible()
    const partnerEmail = uniqueEmail("invitee")
    await page.getByLabel("E-mail do parceiro(a)").fill(partnerEmail)
    await page.getByRole("button", { name: "Salvar casa e enviar convite" }).click()
    await expect(page).toHaveURL(/\/onboarding\/accounts/)

    const { rows } = await db.query<{ id: string }>(
      "SELECT id FROM households WHERE created_by = $1",
      [userId],
    )
    expect(rows).toHaveLength(1)
    const householdId = rows[0]?.id
    if (householdId === undefined) throw new Error("expected the household to exist")
    householdIds.push(householdId)

    await expect(page.getByText("Nenhuma conta ainda.")).toBeVisible()

    // Personal account.
    await page.getByRole("link", { name: /Adicionar conta/ }).click()
    await expect(page).toHaveURL(/\/onboarding\/accounts\/new/)
    await page.getByRole("button", { name: "Nubank" }).click()
    await page.getByLabel("Apelido da conta").fill("E2E Personal Checking")
    await page.getByRole("button", { name: /^Pessoal/ }).click()
    await page.getByLabel("Saldo atual (opcional)").fill("123.45")
    await page.getByRole("button", { name: "Salvar conta" }).click()
    await expect(page).toHaveURL(/\/onboarding\/accounts$/)
    await expect(page.getByText("E2E Personal Checking")).toBeVisible()

    // Shared account.
    await page.getByRole("link", { name: /Adicionar conta/ }).click()
    await page.getByRole("button", { name: "ING" }).click()
    await page.getByLabel("Apelido da conta").fill("E2E Shared Checking")
    await page.getByRole("button", { name: /^Compartilhada/ }).click()
    await page.getByRole("button", { name: "Salvar conta" }).click()
    await expect(page).toHaveURL(/\/onboarding\/accounts$/)
    await expect(page.getByText("E2E Shared Checking")).toBeVisible()
    await expect(page.getByText("E2E Personal Checking")).toBeVisible()

    await page.getByRole("button", { name: "Continuar" }).click()
    await expect(page).toHaveURL(/\/household$/)
    await expect(page.getByRole("heading", { name: "Comece seu primeiro ciclo" })).toBeVisible()
  })

  test("skipping the invite and the accounts step still reaches the Casa shell", async ({
    page,
  }) => {
    const { userId } = await signUpVerifyAndLand(page, db, "skip")
    userIds.push(userId)

    await page.getByLabel("Nome da residência").fill("E2E Skip Household")
    await page.getByRole("button", { name: "Continuar" }).click()
    await page.getByRole("button", { name: "Fazer isso mais tarde" }).click()
    await expect(page).toHaveURL(/\/onboarding\/accounts/)

    const { rows } = await db.query<{ id: string }>(
      "SELECT id FROM households WHERE created_by = $1",
      [userId],
    )
    const householdId = rows[0]?.id
    if (householdId !== undefined) householdIds.push(householdId)

    await page.getByRole("button", { name: "Configurar contas adicionais mais tarde" }).click()
    await expect(page).toHaveURL(/\/household$/)
  })
})

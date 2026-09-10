import { expect, test } from "@playwright/test"
import { type AdminDb, closeAdminDb, connectAdminDb } from "../src/db.ts"
import { cleanupTestData } from "../src/helpers/cleanup.ts"
import { signUpVerifyAndLand } from "../src/helpers/uiFlows.ts"

test.describe("Pessoal: personal accounts and overview", () => {
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

  test("adds a personal account and sees it reflected on the personal overview", async ({
    page,
  }) => {
    const { userId } = await signUpVerifyAndLand(page, db, "personal")
    userIds.push(userId)

    await page.getByLabel("Nome da residência").fill("E2E Personal Household")
    await page.getByRole("button", { name: "Continuar" }).click()
    await page.getByRole("button", { name: "Fazer isso mais tarde" }).click()
    await expect(page).toHaveURL(/\/onboarding\/accounts/)

    const { rows } = await db.query<{ id: string }>(
      "SELECT id FROM households WHERE created_by = $1",
      [userId],
    )
    const householdId = rows[0]?.id
    if (householdId === undefined) throw new Error("expected the household to exist")
    householdIds.push(householdId)

    await page.getByRole("button", { name: "Configurar contas adicionais mais tarde" }).click()
    await expect(page).toHaveURL(/\/household$/)

    await page.getByRole("link", { name: "Pessoal" }).click()
    await expect(page).toHaveURL(/\/personal$/)
    await expect(page.getByRole("heading", { name: "Visão geral pessoal" })).toBeVisible()
    await expect(page.getByText("Nenhuma conta pessoal ainda.").first()).toBeVisible()

    await page.getByRole("navigation").getByRole("link", { name: "Minhas contas" }).click()
    await expect(page).toHaveURL(/\/personal\/accounts/)
    await expect(page.getByRole("heading", { name: "Minhas contas" })).toBeVisible()

    await page.getByRole("button", { name: "Adicionar conta" }).click()
    await page.getByRole("button", { name: "Nubank" }).click()
    await page.getByLabel("Apelido da conta").fill("E2E Personal Savings")
    await page.getByLabel("Saldo atual (opcional)").fill("500")
    await page.getByRole("button", { name: "Salvar conta" }).click()
    await expect(page.getByText("E2E Personal Savings")).toBeVisible()
    await expect(page.getByText(/500,00/)).toBeVisible()

    await page.getByRole("link", { name: "Visão geral", exact: true }).click()
    await expect(page).toHaveURL(/\/personal$/)
    await expect(page.getByText("E2E Personal Savings")).toBeVisible()
    await expect(page.getByText(/500,00/).first()).toBeVisible()

    await page.getByRole("link", { name: "Meus pagamentos" }).click()
    await expect(page).toHaveURL(/\/personal\/payments/)
    await expect(page.getByText("Esta seção chega em breve.")).toBeVisible()

    await page.getByRole("navigation").getByRole("link", { name: "Minhas contas" }).click()
    await page.getByRole("button", { name: "Remover" }).click()
    await expect(page.getByText("Nenhuma conta pessoal ainda.")).toBeVisible()
  })
})

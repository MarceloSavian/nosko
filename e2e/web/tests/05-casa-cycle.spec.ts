import { expect, test } from "@playwright/test"
import { type AdminDb, closeAdminDb, connectAdminDb } from "../src/db.ts"
import { cleanupTestData } from "../src/helpers/cleanup.ts"
import { signUpVerifyAndLand } from "../src/helpers/uiFlows.ts"

test.describe("Casa: start a cycle, fixed bills, payments, transfers", () => {
  let db: AdminDb
  const userIds: string[] = []
  const householdIds: string[] = []

  test.beforeAll(async () => {
    db = await connectAdminDb()
  })

  test.afterAll(async () => {
    // household(id) ON DELETE CASCADE also removes the cycle, its fixed bills, payments,
    // transfers, and the household's seeded categories.
    await cleanupTestData(db, { householdIds, userIds })
    await closeAdminDb(db)
  })

  test("runs the full Casa cycle loop end to end", async ({ page }) => {
    test.setTimeout(90_000)
    const { userId } = await signUpVerifyAndLand(page, db, "casa-cycle")
    userIds.push(userId)

    await page.getByLabel("Nome da residência").fill("E2E Cycle Household")
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

    // Shared account, needed for payments below (payments require a visibility=shared account).
    await page.getByRole("link", { name: /Adicionar conta/ }).click()
    await page.getByRole("button", { name: "ING" }).click()
    await page.getByLabel("Apelido da conta").fill("E2E Cycle Shared Checking")
    await page.getByRole("button", { name: /^Compartilhada/ }).click()
    await page.getByRole("button", { name: "Salvar conta" }).click()
    await expect(page).toHaveURL(/\/onboarding\/accounts$/)

    await page.getByRole("button", { name: "Continuar" }).click()
    await expect(page).toHaveURL(/\/household$/)

    // No cycle yet: start one.
    await expect(page.getByRole("heading", { name: "Comece seu primeiro ciclo" })).toBeVisible()
    await page.getByRole("button", { name: "Iniciar este ciclo" }).click()
    await expect(page.getByRole("heading", { name: "Visão geral da casa" })).toBeVisible()

    // Set the owner's income.
    await page.getByLabel("Membros").selectOption({ index: 1 })
    await page.getByLabel("Valor", { exact: true }).fill("3000")
    await page.getByRole("button", { name: "Definir renda" }).click()
    await expect(page.getByText(/3\.000,00/).first()).toBeVisible()

    // Fixed bills: add one, then mark it paid.
    await page.getByRole("link", { name: "Contas fixas", exact: true }).click()
    await expect(page).toHaveURL(/\/household\/fixed-bills/)
    await page.getByLabel("Nome da conta").fill("E2E Aluguel")
    await page.getByLabel("Categoria").selectOption({ index: 1 })
    await page.getByLabel("Valor", { exact: true }).fill("950")
    await page.getByRole("button", { name: "Adicionar conta" }).click()
    await expect(page.getByText("E2E Aluguel")).toBeVisible()
    await page.getByRole("button", { name: "Marcar como paga" }).click()
    await expect(page.getByRole("button", { name: "Marcar como pendente" })).toBeVisible()

    // Payments: add one against the shared account created earlier.
    await page.getByRole("link", { name: "Pagamentos", exact: true }).click()
    await expect(page).toHaveURL(/\/household\/payments/)
    await page.getByLabel("Conta").selectOption({ index: 1 })
    await page.getByLabel("Categoria").selectOption({ index: 1 })
    await page.getByLabel("Descrição").fill("E2E Mercado")
    await page.getByLabel("Valor", { exact: true }).fill("45.50")
    await page.getByRole("button", { name: "Adicionar pagamento" }).click()
    await expect(page.getByText("E2E Mercado")).toBeVisible()

    // Cycle detail: record and settle a transfer, then close the cycle.
    await page.getByRole("link", { name: "Ciclos", exact: true }).click()
    await expect(page).toHaveURL(/\/household\/cycles$/)
    await page.getByRole("link", { name: /Aberto/ }).click()
    await expect(page).toHaveURL(/\/household\/cycles\/.+/)
    await expect(page.getByRole("heading", { name: "Números do ciclo" })).toBeVisible()

    await page.getByLabel("Contribuições e retiradas").selectOption({ index: 1 })
    await page.getByLabel("Valor").fill("100")
    await page.getByRole("button", { name: "Registrar" }).click()
    await expect(page.getByRole("button", { name: "Marcar como quitado" })).toBeVisible()
    await page.getByRole("button", { name: "Marcar como quitado" }).click()
    await expect(page.getByText("Quitado")).toBeVisible()

    await page.getByRole("button", { name: "Fechar ciclo" }).click()
    await expect(page.getByText("Fechado")).toBeVisible()
  })
})

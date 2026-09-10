import { expect, test } from "@playwright/test"
import { type AdminDb, closeAdminDb, connectAdminDb } from "../src/db.ts"
import { cleanupTestData } from "../src/helpers/cleanup.ts"
import { findInvitationCode } from "../src/helpers/codes.ts"
import { fillOtp, signUpVerifyAndLand } from "../src/helpers/uiFlows.ts"

test.describe("accept invitation: two independent browser sessions", () => {
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

  test("partner accepts an invitation and lands in onboarding", async ({ browser }) => {
    const ownerContext = await browser.newContext()
    const ownerPage = await ownerContext.newPage()
    const { userId: ownerId } = await signUpVerifyAndLand(ownerPage, db, "invite-owner")
    userIds.push(ownerId)

    await ownerPage.getByLabel("Nome da residência").fill("E2E Invite Household")
    await ownerPage.getByRole("button", { name: "Continuar" }).click()

    const partnerContext = await browser.newContext()
    const partnerPage = await partnerContext.newPage()
    const { userId: partnerId, email: partnerEmail } = await signUpVerifyAndLand(
      partnerPage,
      db,
      "invite-partner",
    )
    userIds.push(partnerId)

    await ownerPage.getByLabel("E-mail do parceiro(a)").fill(partnerEmail)
    await ownerPage.getByRole("button", { name: "Salvar casa e enviar convite" }).click()
    await expect(ownerPage).toHaveURL(/\/onboarding\/accounts/)

    const { rows } = await db.query<{ id: string }>(
      "SELECT id FROM households WHERE created_by = $1",
      [ownerId],
    )
    const householdId = rows[0]?.id
    if (householdId === undefined) throw new Error("expected the household to exist")
    householdIds.push(householdId)

    const code = await findInvitationCode(db, partnerEmail)
    await partnerPage.goto(`/invite/accept?householdId=${householdId}`)
    await expect(partnerPage.getByRole("heading", { name: "Você foi convidada(o)" })).toBeVisible()

    // Wrong code first.
    await fillOtp(partnerPage, "000000")
    await partnerPage.getByRole("button", { name: "Aceitar convite e entrar" }).click()
    await expect(partnerPage.getByRole("alert")).toContainText("inválido ou expirado")

    await fillOtp(partnerPage, code)
    await partnerPage.getByRole("button", { name: "Aceitar convite e entrar" }).click()
    await expect(partnerPage).toHaveURL(/\/onboarding\/accounts/)

    const { rows: members } = await db.query<{ user_id: string }>(
      "SELECT user_id FROM household_members WHERE household_id = $1 ORDER BY joined_at",
      [householdId],
    )
    expect(members.map((m) => m.user_id)).toEqual(expect.arrayContaining([ownerId, partnerId]))

    await ownerContext.close()
    await partnerContext.close()
  })
})

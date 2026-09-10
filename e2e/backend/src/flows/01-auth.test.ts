import assert from "node:assert/strict"
import { after, before, describe, it } from "node:test"
import { Either } from "effect"
import { disposeApiRuntime, rpc, rpcEither } from "../client/apiClient.ts"
import { login, logout, mfaVerify, refreshSession, Session } from "../client/httpApi.ts"
import { type AdminDb, closeAdminDb, connectAdminDb } from "../db.ts"
import { cleanupTestData } from "../helpers/cleanup.ts"
import { findAuthTokenCode } from "../helpers/codes.ts"
import { TEST_PASSWORD, uniqueEmail, uniqueName } from "../helpers/testData.ts"
import { generateTotpCode } from "../helpers/totp.ts"

describe("auth: signup, verification, login, mfa, sessions, password reset", () => {
  let db: AdminDb
  const userIds: string[] = []

  before(async () => {
    db = await connectAdminDb()
  })

  after(async () => {
    await cleanupTestData(db, { userIds })
    await closeAdminDb(db)
    await disposeApiRuntime()
  })

  const signUp = async (label: string) => {
    const email = uniqueEmail(label)
    const user = await rpc((client) =>
      client.auth.signUp({
        name: uniqueName(label),
        email,
        password: TEST_PASSWORD,
        preferredLocale: "en",
      }),
    )
    userIds.push(user.id)
    return { ...user, email }
  }

  it("signs up a new user unverified", async () => {
    const user = await signUp("signup")
    assert.equal(user.emailVerified, false)
    assert.equal(user.mfaEnabled, false)
  })

  it("rejects a duplicate signup with the same email", async () => {
    const user = await signUp("dup")
    const result = await rpcEither((client) =>
      client.auth.signUp({
        name: uniqueName("dup2"),
        email: user.email,
        password: TEST_PASSWORD,
        preferredLocale: "en",
      }),
    )
    assert.ok(Either.isLeft(result))
    assert.equal(result.left._tag, "EmailAlreadyRegistered")
  })

  it("rejects email verification with a wrong code", async () => {
    const user = await signUp("badcode")
    const result = await rpcEither((client) =>
      client.auth.verifyEmail({ userId: user.id, code: "000000" }),
    )
    assert.ok(Either.isLeft(result))
    assert.equal(result.left._tag, "TokenInvalid")
  })

  it("rejects login before the email is verified", async () => {
    const user = await signUp("unverified")
    await assert.rejects(login(new Session(), { email: user.email, password: TEST_PASSWORD }))
  })

  it("rejects login with the wrong password", async () => {
    const user = await signUp("wrongpass")
    const code = await findAuthTokenCode(db, user.id, "email_verify")
    await rpc((client) => client.auth.verifyEmail({ userId: user.id, code }))

    await assert.rejects(login(new Session(), { email: user.email, password: "not-the-password" }))
  })

  it("verifies email then logs in, refreshes, and logs out", async () => {
    const user = await signUp("happy")
    const code = await findAuthTokenCode(db, user.id, "email_verify")
    await rpc((client) => client.auth.verifyEmail({ userId: user.id, code }))

    const session = new Session()
    const result = await login(session, { email: user.email, password: TEST_PASSWORD })
    assert.deepEqual(result, { status: "authenticated", userId: user.id })
    assert.match(session.jar.header(), /nosko_at=/)
    assert.match(session.jar.header(), /nosko_rt=/)

    await refreshSession(session)
    assert.match(session.jar.header(), /nosko_at=/)

    await logout(session)
    assert.doesNotMatch(session.jar.header(), /nosko_at=/)
  })

  it("can resend a verification email and use the new code", async () => {
    const user = await signUp("resend")
    await rpc((client) => client.auth.resendVerification({ userId: user.id }))
    const code = await findAuthTokenCode(db, user.id, "email_verify")
    await rpc((client) => client.auth.verifyEmail({ userId: user.id, code }))

    const session = new Session()
    const result = await login(session, { email: user.email, password: TEST_PASSWORD })
    assert.equal(result.status, "authenticated")
  })

  it("enrolls, requires, verifies and disables MFA end to end", async () => {
    const user = await signUp("mfa")
    const code = await findAuthTokenCode(db, user.id, "email_verify")
    await rpc((client) => client.auth.verifyEmail({ userId: user.id, code }))

    const session = new Session()
    await login(session, { email: user.email, password: TEST_PASSWORD })

    const enrollment = await rpc((client) =>
      client.auth.mfaEnroll(undefined, { headers: { cookie: session.jar.header() } }),
    )
    assert.match(enrollment.enrollmentUri, /^otpauth:\/\/totp\//)

    const wrongConfirm = await rpcEither((client) =>
      client.auth.mfaConfirmEnroll(
        { code: "111111" },
        { headers: { cookie: session.jar.header() } },
      ),
    )
    assert.ok(Either.isLeft(wrongConfirm))
    assert.equal(wrongConfirm.left._tag, "MfaCodeInvalid")

    await rpc((client) =>
      client.auth.mfaConfirmEnroll(
        { code: generateTotpCode(enrollment.secret) },
        { headers: { cookie: session.jar.header() } },
      ),
    )

    // A fresh login must now stop at mfa_required instead of completing.
    const freshSession = new Session()
    const loginResult = await login(freshSession, { email: user.email, password: TEST_PASSWORD })
    assert.deepEqual(loginResult, { status: "mfa_required", userId: user.id })
    assert.equal(freshSession.jar.header(), "")

    await assert.rejects(
      mfaVerify(freshSession, { userId: user.id, code: "222222", rememberDevice: false }),
    )

    await mfaVerify(freshSession, {
      userId: user.id,
      code: generateTotpCode(enrollment.secret),
      rememberDevice: false,
    })
    assert.match(freshSession.jar.header(), /nosko_at=/)

    await rpc((client) =>
      client.auth.mfaDisable(undefined, { headers: { cookie: freshSession.jar.header() } }),
    )
    const afterDisableLogin = await login(new Session(), {
      email: user.email,
      password: TEST_PASSWORD,
    })
    assert.equal(afterDisableLogin.status, "authenticated")
  })

  it("lists and revokes sessions", async () => {
    const user = await signUp("sessions")
    const code = await findAuthTokenCode(db, user.id, "email_verify")
    await rpc((client) => client.auth.verifyEmail({ userId: user.id, code }))

    const sessionA = new Session()
    await login(sessionA, { email: user.email, password: TEST_PASSWORD })
    const sessionB = new Session()
    await login(sessionB, { email: user.email, password: TEST_PASSWORD })

    const sessions = await rpc((client) =>
      client.auth.listSessions(undefined, { headers: { cookie: sessionA.jar.header() } }),
    )
    assert.ok(sessions.length >= 2)

    await rpc((client) =>
      client.auth.revokeAllSessions(undefined, { headers: { cookie: sessionA.jar.header() } }),
    )
    await assert.rejects(refreshSession(sessionB))
  })

  it("resets a forgotten password with a code and can log in with the new one", async () => {
    const user = await signUp("reset")
    const verifyCode = await findAuthTokenCode(db, user.id, "email_verify")
    await rpc((client) => client.auth.verifyEmail({ userId: user.id, code: verifyCode }))

    await rpc((client) => client.auth.requestPasswordReset({ email: user.email }))
    const resetCode = await findAuthTokenCode(db, user.id, "password_reset")

    const newPassword = "New-Correct-Horse-9!"
    await rpc((client) =>
      client.auth.resetPassword({
        email: user.email,
        code: resetCode,
        newPassword,
        revokeOtherSessions: true,
      }),
    )

    await assert.rejects(login(new Session(), { email: user.email, password: TEST_PASSWORD }))
    const result = await login(new Session(), { email: user.email, password: newPassword })
    assert.equal(result.status, "authenticated")
  })
})

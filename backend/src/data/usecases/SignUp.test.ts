import { describe, expect, it } from "@jest/globals"
import { Effect, Layer } from "effect"
import { OpaqueTokensLive } from "../../infra/auth/OpaqueTokens"
import { PasswordHasherLive } from "../../infra/auth/PasswordHasher"
import { makeFakeMailer } from "../../test/fakeMailer"
import { makeFakeAuthTokensRepository, makeFakeUsersRepository } from "../../test/fakeRepositories"
import { resendVerification, signUp, verifyEmail } from "./SignUp"

const baseLayers = Layer.mergeAll(PasswordHasherLive, OpaqueTokensLive)

describe("signUp", () => {
  it("creates a user and sends a verification email", async () => {
    const { layer: usersLayer, users } = makeFakeUsersRepository()
    const { layer: authTokensLayer, tokens } = makeFakeAuthTokensRepository()
    const { layer: mailerLayer, sent } = makeFakeMailer()

    const user = await Effect.runPromise(
      signUp({
        name: "Marcelo",
        email: "marcelo@example.com",
        password: "correct horse battery staple",
        preferredLocale: "pt-BR",
      }).pipe(
        Effect.provide(usersLayer),
        Effect.provide(authTokensLayer),
        Effect.provide(mailerLayer),
        Effect.provide(baseLayers),
      ),
    )

    expect(user.email).toBe("marcelo@example.com")
    expect(user).not.toHaveProperty("passwordHash")
    expect(users.size).toBe(1)
    expect(tokens.size).toBe(1)
    expect(sent).toHaveLength(1)
    expect(sent[0]?.to).toBe("marcelo@example.com")
  })

  it("fails with EmailAlreadyRegistered for a duplicate email", async () => {
    const { layer: usersLayer } = makeFakeUsersRepository([
      {
        id: "existing-user",
        email: "marcelo@example.com",
        passwordHash: "hash",
        emailVerified: false,
        mfaEnabled: false,
        mfaSecret: null,
      },
    ])
    const { layer: authTokensLayer } = makeFakeAuthTokensRepository()
    const { layer: mailerLayer } = makeFakeMailer()

    const exit = await Effect.runPromiseExit(
      signUp({
        name: "Marcelo",
        email: "marcelo@example.com",
        password: "x",
        preferredLocale: "pt-BR",
      }).pipe(
        Effect.provide(usersLayer),
        Effect.provide(authTokensLayer),
        Effect.provide(mailerLayer),
        Effect.provide(baseLayers),
      ),
    )

    expect(exit._tag).toBe("Failure")
    if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
      expect(exit.cause.error._tag).toBe("EmailAlreadyRegistered")
    }
  })
})

const signUpAndCapture = async () => {
  const { layer: usersLayer, users } = makeFakeUsersRepository()
  const { layer: authTokensLayer, tokens } = makeFakeAuthTokensRepository()
  const { layer: mailerLayer, sent } = makeFakeMailer()

  const user = await Effect.runPromise(
    signUp({
      name: "Marcelo",
      email: "marcelo@example.com",
      password: "correct horse battery staple",
      preferredLocale: "pt-BR",
    }).pipe(
      Effect.provide(usersLayer),
      Effect.provide(authTokensLayer),
      Effect.provide(mailerLayer),
      Effect.provide(baseLayers),
    ),
  )

  const code = sent[0]?.text.match(/\d{6}/)?.[0] as string

  return { usersLayer, users, authTokensLayer, tokens, mailerLayer, sent, user, code }
}

describe("verifyEmail", () => {
  it("marks the email verified for the correct code", async () => {
    const { usersLayer, authTokensLayer, users, user, code } = await signUpAndCapture()

    await Effect.runPromise(
      verifyEmail({ userId: user.id, code }).pipe(
        Effect.provide(usersLayer),
        Effect.provide(authTokensLayer),
        Effect.provide(baseLayers),
      ),
    )

    expect(users.get(user.id)?.emailVerified).toBe(true)
  })

  it("fails with TokenInvalid for a wrong code", async () => {
    const { usersLayer, authTokensLayer, user } = await signUpAndCapture()

    const exit = await Effect.runPromiseExit(
      verifyEmail({ userId: user.id, code: "000000" }).pipe(
        Effect.provide(usersLayer),
        Effect.provide(authTokensLayer),
        Effect.provide(baseLayers),
      ),
    )

    expect(exit._tag).toBe("Failure")
  })

  it("fails with TokenInvalid when the code was already used", async () => {
    const { usersLayer, authTokensLayer, user, code } = await signUpAndCapture()

    await Effect.runPromise(
      verifyEmail({ userId: user.id, code }).pipe(
        Effect.provide(usersLayer),
        Effect.provide(authTokensLayer),
        Effect.provide(baseLayers),
      ),
    )

    const exit = await Effect.runPromiseExit(
      verifyEmail({ userId: user.id, code }).pipe(
        Effect.provide(usersLayer),
        Effect.provide(authTokensLayer),
        Effect.provide(baseLayers),
      ),
    )

    expect(exit._tag).toBe("Failure")
  })
})

describe("resendVerification", () => {
  it("sends a new verification code", async () => {
    const { usersLayer, authTokensLayer, mailerLayer, user, tokens, sent } =
      await signUpAndCapture()

    await Effect.runPromise(
      resendVerification(user.id).pipe(
        Effect.provide(usersLayer),
        Effect.provide(authTokensLayer),
        Effect.provide(mailerLayer),
        Effect.provide(baseLayers),
      ),
    )

    expect(tokens.size).toBe(2)
    expect(sent).toHaveLength(2)
  })

  it("fails with UserNotFound for an unknown user", async () => {
    const { layer: usersLayer } = makeFakeUsersRepository()
    const { layer: authTokensLayer } = makeFakeAuthTokensRepository()
    const { layer: mailerLayer } = makeFakeMailer()

    const exit = await Effect.runPromiseExit(
      resendVerification("missing").pipe(
        Effect.provide(usersLayer),
        Effect.provide(authTokensLayer),
        Effect.provide(mailerLayer),
        Effect.provide(baseLayers),
      ),
    )

    expect(exit._tag).toBe("Failure")
  })
})

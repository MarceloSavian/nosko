import { describe, expect, it, jest } from "@jest/globals"
import { ConfigProvider, Effect } from "effect"
import { Mailer } from "./Mailer"
import { ResendMailerLive } from "./ResendMailer"

const withConfig = ConfigProvider.fromMap(
  new Map([
    ["EMAIL_FROM", "noreply@mail.nosko.app"],
    ["RESEND_API_KEY", "re_test_key"],
  ]),
)

const run = <A, E>(effect: Effect.Effect<A, E, Mailer>) =>
  Effect.runPromise(
    effect.pipe(Effect.provide(ResendMailerLive), Effect.withConfigProvider(withConfig)),
  )

describe("ResendMailerLive", () => {
  it("sends a simple email through the Resend API", async () => {
    const fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }))

    await run(
      Effect.gen(function* () {
        const mailer = yield* Mailer
        return yield* mailer.send({
          to: "marcelo@example.com",
          subject: "Test",
          text: "hello",
          html: "<p>hello</p>",
        })
      }),
    )

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("https://api.resend.com/emails")
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer re_test_key")
    const body = JSON.parse(init.body as string)
    expect(body).toEqual({
      from: "noreply@mail.nosko.app",
      to: "marcelo@example.com",
      subject: "Test",
      text: "hello",
      html: "<p>hello</p>",
    })

    fetchSpy.mockRestore()
  })

  it("maps a non-ok response to MailerError", async () => {
    const fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("invalid api key", { status: 401 }))

    const exit = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const mailer = yield* Mailer
        return yield* mailer.send({
          to: "marcelo@example.com",
          subject: "Test",
          text: "hello",
          html: "<p>hello</p>",
        })
      }).pipe(Effect.provide(ResendMailerLive), Effect.withConfigProvider(withConfig)),
    )

    expect(exit._tag).toBe("Failure")
    if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
      expect(exit.cause.error._tag).toBe("MailerError")
    }

    fetchSpy.mockRestore()
  })

  it("maps a rejected fetch to MailerError", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"))

    const exit = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const mailer = yield* Mailer
        return yield* mailer.send({
          to: "marcelo@example.com",
          subject: "Test",
          text: "hello",
          html: "<p>hello</p>",
        })
      }).pipe(Effect.provide(ResendMailerLive), Effect.withConfigProvider(withConfig)),
    )

    expect(exit._tag).toBe("Failure")
    if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
      expect(exit.cause.error._tag).toBe("MailerError")
    }

    fetchSpy.mockRestore()
  })
})

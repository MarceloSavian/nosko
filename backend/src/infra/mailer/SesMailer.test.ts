import { SESv2Client, type SendEmailCommand } from "@aws-sdk/client-sesv2"
import { describe, expect, it, jest } from "@jest/globals"
import { ConfigProvider, Effect } from "effect"
import { Mailer } from "./Mailer"
import { SesMailerLive } from "./SesMailer"

const withConfig = ConfigProvider.fromMap(new Map([["EMAIL_FROM", "noreply@nosko.app"]]))

const run = <A, E>(effect: Effect.Effect<A, E, Mailer>) =>
  Effect.runPromise(
    effect.pipe(Effect.provide(SesMailerLive), Effect.withConfigProvider(withConfig)),
  )

describe("SesMailerLive", () => {
  it("sends a simple email through SESv2Client", async () => {
    const send = jest
      .spyOn(SESv2Client.prototype, "send")
      .mockResolvedValue({ MessageId: "message-1" } as never)

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

    expect(send).toHaveBeenCalledTimes(1)
    const command = send.mock.calls[0]?.[0] as SendEmailCommand
    expect(command.input.FromEmailAddress).toBe("noreply@nosko.app")
    expect(command.input.Destination?.ToAddresses).toEqual(["marcelo@example.com"])
    expect(command.input.Content?.Simple?.Subject?.Data).toBe("Test")

    send.mockRestore()
  })

  it("maps a client failure to MailerError", async () => {
    const send = jest
      .spyOn(SESv2Client.prototype, "send")
      .mockRejectedValue(new Error("SES is down") as never)

    const exit = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const mailer = yield* Mailer
        return yield* mailer.send({
          to: "marcelo@example.com",
          subject: "Test",
          text: "hello",
          html: "<p>hello</p>",
        })
      }).pipe(Effect.provide(SesMailerLive), Effect.withConfigProvider(withConfig)),
    )

    expect(exit._tag).toBe("Failure")
    if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
      expect(exit.cause.error._tag).toBe("MailerError")
    }

    send.mockRestore()
  })
})

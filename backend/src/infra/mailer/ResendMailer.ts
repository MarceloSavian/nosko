import { Config, Effect, Layer, Redacted } from "effect"
import { Mailer, MailerError } from "./Mailer"

const RESEND_API_URL = "https://api.resend.com/emails"

export const ResendMailerLive = Layer.effect(
  Mailer,
  Effect.gen(function* () {
    const from = yield* Config.string("EMAIL_FROM")
    const apiKey = yield* Config.redacted("RESEND_API_KEY")

    return {
      send: (message) =>
        Effect.tryPromise({
          try: async () => {
            const response = await fetch(RESEND_API_URL, {
              method: "POST",
              headers: {
                authorization: `Bearer ${Redacted.value(apiKey)}`,
                "content-type": "application/json",
              },
              body: JSON.stringify({
                from,
                to: message.to,
                subject: message.subject,
                text: message.text,
                html: message.html,
              }),
            })
            if (!response.ok) {
              throw new Error(`Resend responded with ${response.status}: ${await response.text()}`)
            }
          },
          catch: (cause) => new MailerError({ cause }),
        }),
    }
  }),
)

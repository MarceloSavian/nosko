import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2"
import { Config, Effect, Layer } from "effect"
import { Mailer, MailerError } from "./Mailer"

export const SesMailerLive = Layer.effect(
  Mailer,
  Effect.gen(function* () {
    const from = yield* Config.string("EMAIL_FROM")
    const client = new SESv2Client({})

    return {
      send: (message) =>
        Effect.tryPromise({
          try: () =>
            client.send(
              new SendEmailCommand({
                FromEmailAddress: from,
                Destination: { ToAddresses: [message.to] },
                Content: {
                  Simple: {
                    Subject: { Data: message.subject, Charset: "UTF-8" },
                    Body: {
                      Text: { Data: message.text, Charset: "UTF-8" },
                      Html: { Data: message.html, Charset: "UTF-8" },
                    },
                  },
                },
              }),
            ),
          catch: (cause) => new MailerError({ cause }),
        }).pipe(Effect.asVoid),
    }
  }),
)

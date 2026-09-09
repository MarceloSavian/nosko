import { Effect, Layer } from "effect"
import type { EmailMessage } from "../infra/mailer/Mailer"
import { Mailer } from "../infra/mailer/Mailer"

export const makeFakeMailer = () => {
  const sent: Array<EmailMessage> = []

  const layer = Layer.succeed(Mailer, {
    send: (message) =>
      Effect.sync(() => {
        sent.push(message)
      }),
  })

  return { layer, sent }
}

import { Context, Data, type Effect } from "effect"

export class MailerError extends Data.TaggedError("MailerError")<{
  readonly cause: unknown
}> {}

export interface EmailMessage {
  readonly to: string
  readonly subject: string
  readonly text: string
  readonly html: string
}

export class Mailer extends Context.Tag("Mailer")<
  Mailer,
  {
    readonly send: (message: EmailMessage) => Effect.Effect<void, MailerError>
  }
>() {}

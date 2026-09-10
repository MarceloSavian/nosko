import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema } from "effect"
import {
  EmailNotVerified,
  InvalidCredentials,
  MfaCodeInvalid,
  SessionInvalid,
} from "./errors/authErrors"

export const LoginResultView = Schema.Union(
  Schema.Struct({ status: Schema.Literal("authenticated"), userId: Schema.UUID }),
  Schema.Struct({ status: Schema.Literal("mfa_required"), userId: Schema.UUID }),
)
export type LoginResultView = typeof LoginResultView.Type

export const AuthApiGroup = HttpApiGroup.make("auth")
  .add(
    HttpApiEndpoint.post("login", "/login")
      .setPayload(
        Schema.Struct({
          email: Schema.String,
          password: Schema.String,
          deviceToken: Schema.optional(Schema.String),
        }),
      )
      .addSuccess(LoginResultView)
      .addError(InvalidCredentials)
      .addError(EmailNotVerified),
  )
  .add(
    HttpApiEndpoint.post("mfaVerify", "/mfa-verify")
      .setPayload(
        Schema.Struct({
          userId: Schema.UUID,
          code: Schema.String,
          rememberDevice: Schema.Boolean,
        }),
      )
      .addSuccess(Schema.Struct({ userId: Schema.UUID }))
      .addError(MfaCodeInvalid),
  )
  .add(HttpApiEndpoint.post("refresh", "/refresh").addSuccess(Schema.Void).addError(SessionInvalid))
  .add(HttpApiEndpoint.post("logout", "/logout").addSuccess(Schema.Void))

export const AuthApi = HttpApi.make("nosko").add(AuthApiGroup).prefix("/api/http/auth")

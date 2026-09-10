import { LambdaHandler } from "@effect-aws/lambda"
import { AppLive } from "./layers"

export const handler = LambdaHandler.fromHttpApi(AppLive)

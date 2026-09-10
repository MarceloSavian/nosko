import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "@effect/platform"
import { Schema } from "effect"
import { SessionInvalid } from "./errors/authErrors.ts"
import { CycleNotFound } from "./errors/cycleErrors.ts"
import { NoHousehold } from "./errors/householdErrors.ts"

export const PaymentsApiGroup = HttpApiGroup.make("payments")
  .add(
    HttpApiEndpoint.get("exportCsv", "/export")
      .setUrlParams(Schema.Struct({ cycleId: Schema.UUID }))
      .addSuccess(HttpApiSchema.Text({ contentType: "text/csv" }))
      .addError(SessionInvalid)
      .addError(NoHousehold)
      .addError(CycleNotFound),
  )
  .prefix("/api/http/payments")

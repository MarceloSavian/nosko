import { HttpApi } from "@effect/platform"
import { AuthApiGroup } from "./authHttp.ts"
import { PaymentsApiGroup } from "./paymentsHttp.ts"

export const NoskoHttpApi = HttpApi.make("nosko").add(AuthApiGroup).add(PaymentsApiGroup)
